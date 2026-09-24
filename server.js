import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createClient } from 'redis';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, deleteDoc, getCountFromServer, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { scrapeAndSyncIndiaGovSchemes } from './scripts/scrape_india_gov_schemes.js';
import { extractTextFromPdf, extractKeyDetailsForAI, processSchemeDocumentPdf } from './services/pdfProcessingService.js';
import { generate_text_audio, sanitizeTeluguSpeechText } from './services/audioService.js';

let firebaseConfig = {};
try {
  const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) {
  console.log("Firebase config not found.");
}

let dbAdmin = null;
if (firebaseConfig.projectId && getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  dbAdmin = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
} else if (getApps().length > 0) {
  dbAdmin = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId || '(default)');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-Tier Redis & In-Memory Cache Engine
let redisUrl = 'redis://localhost:6379';
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
  redisUrl = process.env.REDIS_URL.trim();
}

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    connectTimeout: 2000,
  }
});

let isRedisConnected = false;
const memoryCache = new Map();
const MEMORY_CACHE_MAX = 5000;

redisClient.on('error', () => {
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Connected to Redis cache service.');
});

redisClient.on('ready', () => {
  isRedisConnected = true;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

redisClient.connect().catch(() => {
  console.log('ℹ️ Redis standalone server not reached; using in-memory high-speed LRU fallback cache.');
});

async function getCache(key) {
  // 1. Check in-memory fast tier (0ms latency)
  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.expiresAt && Date.now() > mem.expiresAt) {
      memoryCache.delete(key);
    } else {
      return mem.value;
    }
  }

  // 2. Check Redis tier
  if (isRedisConnected) {
    try {
      const val = await redisClient.get(key);
      if (val) {
        const parsed = JSON.parse(val);
        // Backfill memory tier
        if (memoryCache.size < MEMORY_CACHE_MAX) {
          memoryCache.set(key, { value: parsed, expiresAt: Date.now() + 60000 });
        }
        return parsed;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function setCache(key, value, exp = 3600) {
  // 1. Set in memory tier
  if (memoryCache.size >= MEMORY_CACHE_MAX) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + (exp * 1000) });

  // 2. Set in Redis tier
  if (isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: exp });
    } catch (e) {}
  }
}

async function delCache(key) {
  memoryCache.delete(key);
  if (isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch (e) {}
  }
}

async function flushSchemeCache() {
  memoryCache.clear();
  if (isRedisConnected) {
    try {
      const keys = await redisClient.keys('scheme:*');
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
      const facKeys = await redisClient.keys('facilities:*');
      if (facKeys && facKeys.length > 0) {
        await redisClient.del(facKeys);
      }
    } catch (e) {}
  }
}

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Setup middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY || 'smartgov-session-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
});
app.get('/manifest.webmanifest', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.webmanifest'));
});

// Upload configuration for PDF and Scanned Document simplification (20MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/bmp'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpg|jpeg|png|webp|tif|tiff|bmp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }
});

// Load Scheme Data
const DATA_DIR = path.join(__dirname, 'data');
const schemes = {};
let schemeNames = [];
const slugToScheme = {};

function generateSlug(name) {
  const h = crypto.createHash('sha256').update(name).digest('hex').slice(0, 6);
  const engMatch = name.match(/\((.*?)\)/);
  const baseStr = engMatch ? engMatch[1] : name;
  const cleaned = baseStr.toLowerCase().replace(/[^\w\s-]/g, '');
  let slugBase = cleaned.replace(/[-\s]+/g, '-').replace(/^-|-$/g, '');
  slugBase = slugBase.slice(0, 50);
  if (!slugBase) slugBase = 'scheme';
  return `${slugBase}-${h}`;
}

/**
 * Robust scheme resolver matching direct keys, slugs, names, aliases, or Telugu titles
 */
function findScheme(identifier) {
  if (!identifier) return null;
  const rawId = String(identifier).trim();
  // 1. Direct map key
  if (schemes[rawId]) return { name: rawId, data: schemes[rawId] };

  // 2. Direct slug lookup
  if (slugToScheme[rawId] && schemes[slugToScheme[rawId]]) {
    return { name: slugToScheme[rawId], data: schemes[slugToScheme[rawId]] };
  }

  // 3. Exact case-insensitive match on name, slug, scheme_name, or telugu_name
  const lower = rawId.toLowerCase();
  for (const [name, data] of Object.entries(schemes)) {
    if (name.toLowerCase() === lower) return { name, data };
    if (data.slug && data.slug.toLowerCase() === lower) return { name, data };
    if (data.scheme_name && data.scheme_name.toLowerCase() === lower) return { name, data };
    if (data.telugu_name && data.telugu_name.toLowerCase() === lower) return { name, data };
  }

  // 4. Slug prefix match (slug without hash)
  for (const [name, data] of Object.entries(schemes)) {
    if (data.slug && (data.slug.startsWith(lower) || lower.startsWith(data.slug.replace(/-[a-f0-9]{6}$/, '')))) {
      return { name, data };
    }
  }

  // 5. Keyword or alias substring match
  for (const [name, data] of Object.entries(schemes)) {
    const combined = `${name} ${data.scheme_name || ''} ${data.telugu_name || ''}`.toLowerCase();
    if (combined.includes(lower) || lower.includes(name.toLowerCase())) {
      return { name, data };
    }
  }

  return null;
}

function loadSchemesData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.warn(`Data directory '${DATA_DIR}' does not exist.`);
      return;
    }

    const files = fs.readdirSync(DATA_DIR).sort();
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'scheme_schema.json' && file !== 'facilities.json') {
        const filePath = path.join(DATA_DIR, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (typeof content === 'object' && content !== null) {
            for (const [sName, sData] of Object.entries(content)) {
              if (sData && sData.category && (sData.simplified || sData.telugu)) {
                sData.slug = generateSlug(sName);
                sData.voice_url = '/public/audio/' + sData.slug + '.mp3';
                schemes[sName] = sData;
                slugToScheme[sData.slug] = sName;
              }
            }
          }
        } catch (err) {
          console.error(`Error loading scheme file ${file}:`, err.message);
        }
      }
    }
    schemeNames = Object.keys(schemes).sort();
    console.log(`Loaded ${schemeNames.length} valid schemes.`);
  } catch (err) {
    console.error('Failed to load schemes:', err);
  }
}

// Load Facilities Data
let facilitiesData = [];
function loadFacilitiesData() {
  const facPath = path.join(DATA_DIR, 'facilities.json');
  if (fs.existsSync(facPath)) {
    try {
      facilitiesData = JSON.parse(fs.readFileSync(facPath, 'utf8'));
      console.log(`Loaded ${facilitiesData.length} facilities.`);
    } catch (err) {
      console.error('Failed to load facilities.json:', err.message);
    }
  }
}

async function prewarmCache() {
  try {
    console.log('⚡ Prewarming Redis and in-memory cache for ultra-fast query execution...');
    // 1. All schemes
    await setCache('scheme:all', schemes, 86400);

    // 2. Summary
    const summary = computeSchemesSummary();
    await setCache('scheme:summary', { success: true, ...summary }, 86400);

    // 3. Common batch pagination pages (pages 1 to 5)
    const limit = 25;
    const total = schemeNames.length;
    const totalPages = Math.ceil(total / limit) || 1;

    for (let page = 1; page <= Math.min(totalPages, 10); page++) {
      const offset = (page - 1) * limit;
      const slice = schemeNames.slice(offset, offset + limit);
      const batchSchemes = {};
      const batchList = [];

      slice.forEach(name => {
        const s = schemes[name];
        if (s) {
          batchSchemes[name] = s;
          batchList.push({ name, ...s });
        }
      });

      const pageResult = {
        success: true,
        total,
        page,
        limit,
        offset,
        totalPages,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
        nextPage: offset + limit < total ? page + 1 : null,
        count: slice.length,
        schemes: batchSchemes,
        schemesList: batchList
      };

      await setCache(`scheme:batch::::25:${offset}:${page}`, pageResult, 86400);
      await setCache(`scheme:query::::25:${offset}`, pageResult, 86400);
    }

    // 4. Cache individual scheme details for top/frequent schemes
    for (const name of schemeNames) {
      const s = schemes[name];
      if (s) {
        const cacheKey = `scheme:detail:${encodeURIComponent(name)}`;
        const voiceUrl = s.voice_url || (s.audio_file ? `/public/${s.audio_file.replace(/^(\/?static\/)?/i, '').replace(/^\/+/, '')}` : null);
        const payload = {
          request_id: 'prewarmed_' + crypto.randomUUID(),
          scheme_name: name,
          level: s.level || 'Andhra Pradesh',
          category: s.category || 'Health',
          source_name: s.source_name || 'Government of Andhra Pradesh',
          source_url: s.official_website || s.source_url || '',
          is_ai_generated: false,
          simplified: s.simplified || {},
          telugu: s.telugu || {},
          voice_url: voiceUrl,
        };
        await setCache(cacheKey, payload, 86400);
      }
    }
    console.log(`🚀 Prewarmed cache for ${schemeNames.length} schemes! Sub-second response times guaranteed.`);
  } catch (err) {
    console.warn('Prewarming cache warning:', err.message);
  }
}

loadSchemesData();
loadFacilitiesData();
setTimeout(() => prewarmCache(), 500);

// Cache for pre-aggregated schemes analytics summary
let cachedSchemesSummary = null;
let summaryLastUpdated = 0;

function computeSchemesSummary() {
  const now = Date.now();
  if (cachedSchemesSummary && (now - summaryLastUpdated < 60000)) {
    return cachedSchemesSummary;
  }

  const categoryCounts = {};
  const ageGroupCounts = {
    all_ages: 0,
    mothers_infants: 0,
    children_youth: 0,
    adults: 0,
    seniors: 0
  };
  const incomeTiers = {
    under5L: 0,
    under2_5L: 0,
    bpl: 0,
    universal: 0
  };
  const benefitTiers = {
    max25L: 0,
    tier10_25L: 0,
    tier5_10L: 0,
    tier1_5L: 0,
    freeCare: 0,
    pensions: 0
  };
  let apCount = 0;
  let nationalCount = 0;

  const stubs = [];

  for (const name of schemeNames) {
    const s = schemes[name];
    if (!s) continue;

    // Level
    if (s.level === 'Andhra Pradesh') apCount++;
    else nationalCount++;

    // Category
    const cat = (s.category || 'General Healthcare').trim();
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Age groups
    const fullText = `${name} ${s.telugu_name || ''} ${s.category || ''} ${JSON.stringify(s.simplified || {})} ${JSON.stringify(s.telugu || {})}`.toLowerCase();
    if (fullText.includes('pregnant') || fullText.includes('mother') || fullText.includes('infant') || fullText.includes('bidda') || fullText.includes('maternal') || fullText.includes('newborn') || fullText.includes('delivery')) {
      ageGroupCounts.mothers_infants++;
    } else if (fullText.includes('senior') || fullText.includes('vridha') || fullText.includes('old age') || fullText.includes('60') || fullText.includes('pensioner')) {
      ageGroupCounts.seniors++;
    } else if (fullText.includes('child') || fullText.includes('girl') || fullText.includes('school') || fullText.includes('kishori') || fullText.includes('adolescent')) {
      ageGroupCounts.children_youth++;
    } else if (fullText.includes('employee') || fullText.includes('worker') || fullText.includes('driver') || fullText.includes('unorganized') || fullText.includes('artisan')) {
      ageGroupCounts.adults++;
    } else {
      ageGroupCounts.all_ages++;
    }

    // Income
    const incText = `${s.simplified?.eligibility || ''} ${s.telugu?.eligibility || ''} ${s.target_beneficiary || ''}`.toLowerCase();
    if (incText.includes('5,00,000') || incText.includes('5 lakh') || incText.includes('5 లక్షల')) {
      incomeTiers.under5L++;
    } else if (incText.includes('2,50,000') || incText.includes('2.5 lakh') || incText.includes('2.5 లక్షల')) {
      incomeTiers.under2_5L++;
    } else if (incText.includes('bpl') || incText.includes('white card') || incText.includes('రేషన్ కార్డు') || incText.includes('rice card')) {
      incomeTiers.bpl++;
    } else {
      incomeTiers.universal++;
    }

    // Benefit
    const benText = `${s.benefit_amount || ''} ${s.benefit_amount_te || ''} ${s.simplified?.benefits || ''} ${s.telugu?.benefits || ''}`.toLowerCase();
    if (benText.includes('25,00,000') || benText.includes('25 lakh') || benText.includes('25 లక్షల')) {
      benefitTiers.max25L++;
    } else if (benText.includes('10,00,000') || benText.includes('10 lakh') || benText.includes('15 lakh') || benText.includes('20 lakh')) {
      benefitTiers.tier10_25L++;
    } else if (benText.includes('5,00,000') || benText.includes('5 lakh') || benText.includes('5 లక్షల')) {
      benefitTiers.tier5_10L++;
    } else if (benText.includes('1,00,000') || benText.includes('2,00,000') || benText.includes('1 lakh') || benText.includes('2 lakh')) {
      benefitTiers.tier1_5L++;
    } else if (benText.includes('pension') || benText.includes('పెన్షన్') || benText.includes('నెలకు') || benText.includes('/month')) {
      benefitTiers.pensions++;
    } else {
      benefitTiers.freeCare++;
    }

    stubs.push({
      id: s.slug || generateSlug(name),
      name,
      name_te: s.telugu_name || name,
      category: s.category || 'General Healthcare',
      category_te: s.category_te || s.category || 'సాధారణ వైద్య సేవలు',
      level: s.level || 'Andhra Pradesh',
      benefit_amount: s.benefit_amount || '',
      benefit_amount_te: s.benefit_amount_te || '',
      slug: s.slug || generateSlug(name)
    });
  }

  cachedSchemesSummary = {
    total: schemeNames.length,
    apCount,
    nationalCount,
    categoryCounts,
    ageGroupCounts,
    incomeTiers,
    benefitTiers,
    stubs,
    updatedAt: new Date().toISOString()
  };
  summaryLastUpdated = now;
  return cachedSchemesSummary;
}

function invalidateSchemesCache() {
  cachedSchemesSummary = null;
  summaryLastUpdated = 0;
}

async function syncSchemesFromFirestore() {
  if (!dbAdmin) return;
  try {
    const snap = await getDocs(collection(dbAdmin, 'schemes'));
    let fsCount = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.scheme_name && !schemes[data.scheme_name]) {
        const sName = data.scheme_name;
        data.slug = data.id || generateSlug(sName);
        data.voice_url = '/public/audio/' + data.slug + '.mp3';
        schemes[sName] = data;
        slugToScheme[data.slug] = sName;
        fsCount++;
      }
    });
    if (fsCount > 0) {
      schemeNames = Object.keys(schemes).sort();
      invalidateSchemesCache();
      console.log(`Synced ${fsCount} schemes from Firestore database. Total active schemes: ${schemeNames.length}`);
    }
  } catch (err) {
    console.warn('Could not sync schemes from Firestore:', err.message);
  }
}
syncSchemesFromFirestore();

// In-Memory Database for Requests, Feedback, and Shares
const db = {
  requests: [],
  feedback: [],
  staffFeedback: [],
  whatsappShares: [],
};

let nextRequestId = 1;
let nextFeedbackId = 1;

function logRequest(schemeName, source) {
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: schemeName,
    source,
    timestamp: new Date().toISOString(),
  };
  db.requests.push(docData);
  if (dbAdmin) {
    setDoc(doc(dbAdmin, 'requests', id), docData).catch(err => console.error("Firebase err:", err));
  }
  return id;
}

async function saveFeedback(requestId, rating, comment = '') {
  const id = crypto.randomUUID();
  let scheme_name = '';
  const reqMemory = db.requests.find((r) => String(r.id) === String(requestId));
  if (reqMemory) {
    scheme_name = reqMemory.scheme_name;
  } else if (dbAdmin) {
    try {
      const reqDoc = await getDoc(doc(dbAdmin, 'requests', String(requestId)));
      if (reqDoc.exists) {
        scheme_name = reqDoc.data().scheme_name;
      }
    } catch(e) {}
  }
  
  const docData = {
    id,
    request_id: requestId,
    scheme_name: scheme_name || 'Unknown',
    rating: Number(rating) || 0,
    comment,
    timestamp: new Date().toISOString(),
  };
  db.feedback.push(docData);
  if (dbAdmin) {
    await setDoc(doc(dbAdmin, 'feedback', id), docData).catch(err => console.error("Firebase err:", err));
  }
  return id;
}

async function getDashboardMetrics() {
  let totalRequests = db.requests.length;
  let totalFeedback = db.feedback.length;
  let totalGrievances = db.staffFeedback.length;
  let totalShares = db.whatsappShares.length;
  let avgRating = 0;

  if (dbAdmin) {
    try {
      const [reqSnap, fbSnap, shareSnap, staffSnap, allFbSnap] = await Promise.all([
        getCountFromServer(collection(dbAdmin, 'requests')),
        getCountFromServer(collection(dbAdmin, 'feedback')),
        getCountFromServer(collection(dbAdmin, 'whatsappShares')),
        getCountFromServer(collection(dbAdmin, 'staffFeedback')),
        getDocs(collection(dbAdmin, 'feedback'))
      ]);
      totalRequests = reqSnap.data().count;
      totalFeedback = fbSnap.data().count;
      totalShares = shareSnap.data().count;
      totalGrievances = staffSnap.data().count;
      
      let sum = 0;
      allFbSnap.forEach(d => { sum += (d.data().rating || 0); });
      if (totalFeedback > 0) {
        avgRating = Number((sum / totalFeedback).toFixed(1));
      }
      return { total_requests: totalRequests, total_feedback: totalFeedback, total_grievances: totalGrievances, avg_rating: avgRating, total_shares: totalShares };
    } catch (e) { console.error('Firebase count error:', e); }
  }

  if (totalFeedback > 0) {
    const sum = db.feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
    avgRating = Number((sum / totalFeedback).toFixed(1));
  }
  return {
    total_requests: totalRequests,
    total_feedback: totalFeedback,
    total_grievances: totalGrievances,
    avg_rating: avgRating,
    total_shares: totalShares,
  };
}

async function getSchemeStats() {
  const counts = {};
  const ratings = {};
  const ratingCounts = {};

  if (dbAdmin) {
    try {
      const reqs = await getDocs(collection(dbAdmin, 'requests'));
      reqs.forEach(d => {
        const data = d.data();
        counts[data.scheme_name] = (counts[data.scheme_name] || 0) + 1;
      });
      const fbs = await getDocs(collection(dbAdmin, 'feedback'));
      fbs.forEach(d => {
        const data = d.data();
        if (data.scheme_name && data.scheme_name !== 'Unknown') {
          ratings[data.scheme_name] = (ratings[data.scheme_name] || 0) + data.rating;
          ratingCounts[data.scheme_name] = (ratingCounts[data.scheme_name] || 0) + 1;
        }
      });
    } catch(e) { console.error(e); }
  } else {
    for (const r of db.requests) {
      counts[r.scheme_name] = (counts[r.scheme_name] || 0) + 1;
    }
    for (const f of db.feedback) {
      const req = db.requests.find((r) => String(r.id) === String(f.request_id));
      const sName = f.scheme_name && f.scheme_name !== 'Unknown' ? f.scheme_name : (req ? req.scheme_name : null);
      if (sName) {
        ratings[sName] = (ratings[sName] || 0) + f.rating;
        ratingCounts[sName] = (ratingCounts[sName] || 0) + 1;
      }
    }
  }

  const result = [];
  for (const [name, count] of Object.entries(counts)) {
    let avg = null;
    if (ratingCounts[name]) {
      avg = (ratings[name] / ratingCounts[name]).toFixed(1);
    }
    result.push({ name, count, rating: avg });
  }
  result.sort((a, b) => b.count - a.count);
  return result;
}

// Distance Calculation Helper (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * R;
}

// Gemini AI Client Helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return null;
}

// Chat Grounding & Keyword Matching
const ALIASES = {
  ఆరోగ్యశ్రీ: ['Dr. NTR Vaidya Seva', 'వైద్య సేవ', 'cashless', 'hospital', 'aarogya'],
  aarogyasri: ['Dr. NTR Vaidya Seva', 'cashless', 'hospital', 'aarogya'],
  'ఆరోగ్య ఆసరా': ['Aarogya Asara', 'post-operative', 'wage', 'allowance'],
  'ఆరోగ్య సురక్ష': ['Aarogya Suraksha', 'screening', 'camps', 'doorstep'],
  'కంటి వెలుగు': ['Kanti Velugu', 'eye', 'spectacles', 'glasses', 'cataract'],
  ఆసుపత్రి: ['hospital', 'treatment'],
  'ఉచిత చికిత్స': ['cashless', 'hospital', 'treatment'],
  'ఉచిత వైద్యం': ['cashless', 'hospital', 'treatment'],
  మందులు: ['medicine', 'medicines', 'drugs', 'Janaushadhi'],
  పరీక్షలు: ['tests', 'diagnostics', 'checkup', 'screening'],
  గర్భం: ['pregnancy', 'maternity', 'maternal', 'గర్భిణి', 'PMSMA', 'PMMVY', 'Janani'],
  గర్భిణీ: ['pregnancy', 'maternity', 'maternal', 'గర్భిణి', 'PMSMA', 'PMMVY', 'Janani'],
  ప్రసవం: ['delivery', 'maternity', 'institutional delivery', '102'],
  పిల్లల: ['children', 'child health', 'pediatric', 'బాల స్వాస్థ్య', 'newborn', 'Cochlear'],
  పిల్లలు: ['children', 'child health', 'pediatric', 'బాల స్వాస్థ్య', 'newborn', 'Cochlear'],
  వృద్ధులు: ['elderly', 'senior citizens', 'geriatric', 'NPHCE'],
  రక్తహీనత: ['anemia', 'anaemia', 'Anaemia Mukt'],
  కంటి: ['blindness', 'eye', 'Kanti Velugu', 'cataract'],
  చెవి: ['deafness', 'hearing', 'Cochlear'],
  రేబిస్: ['rabies', 'dog bite'],
  కిడ్నీ: ['kidney', 'dialysis', 'CKD', 'Uddanam'],
  డయాలసిస్: ['dialysis', 'kidney', 'CKD'],
  తలసేమియా: ['Thalassaemia', 'Haemophilia', 'blood transfusion'],
  హీమోఫీలియా: ['Haemophilia', 'Thalassaemia', 'blood transfusion'],
  క్షయ: ['tb', 'tuberculosis', 'Nikshay', 'Ni-kshay', 'NTEP'],
  టీకా: ['vaccination', 'immunization', 'Indradhanush'],
  టీకాలు: ['vaccination', 'immunization', 'Indradhanush'],
  'మానసిక ఆరోగ్యం': ['Tele-MANAS', 'Mental Health', '14416', 'counseling'],
  ఒత్తిడి: ['Tele-MANAS', 'Mental Health', '14416', 'counseling'],
  అంబులెన్స్: ['108', '104', '102', 'Ambulance'],
};

const STOPWORDS = new Set([
  'పథకం',
  'పథకాలు',
  'కావాలి',
  'నాకు',
  'గురించి',
  'చెప్పండి',
  'ఉన్నాయి',
  'ఏమిటి',
  'ఎలా',
  'ఎవరు',
  'ఏ',
  'ఉంది',
  'ఉచితంగా',
  'లో',
  'health',
  'scheme',
  'schemes',
  'for',
  'me',
  'want',
  'need',
  'tell',
  'hi',
  'hello',
  'hey',
  'namaste',
  'namaskaram',
  'namaskar',
  'thanks',
  'thank',
  'thankyou',
  'bye',
  'good',
  'morning',
  'afternoon',
  'evening',
  'hiii',
  'heyya',
]);

function retrieveRelevantSchemes(question, lang = 'te', maxResults = 4, history = []) {
  const currentQuery = (question || '').trim();
  const qLower = currentQuery.toLowerCase().replace(/[.,?!'\"(){}\[\]:;-]/g, '');

  // Ignore scheme matching for pure conversational greetings
  const GREETING_REGEX = /^(hi+|hello+|hey+|namaste+|namaskaram+|namaskar+|good\s*(morning|afternoon|evening)|hi\s+there|howdy|greetings|who\s+are\s+you|what\s+can\s+you\s+do|నమస్కారం|నమస్తే|హలో|హాయ్|ధన్యవాదాలు|థ్యాంక్స్|బై)$/i;
  if (GREETING_REGEX.test(qLower)) {
    return [];
  }

  const tokens = qLower.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));

  // Extract prior user search context (exclude bot responses to prevent topic bleeding)
  const priorUserContext = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-4)) {
      if (!h) continue;
      const role = (h.role || '').toLowerCase();
      if (role === 'user') {
        const text = (h.text || (h.parts && h.parts[0]?.text) || h.content || '').trim();
        if (text && text.toLowerCase() !== qLower) {
          priorUserContext.push(text.toLowerCase());
        }
      }
    }
  }
  const priorUserText = priorUserContext.join(' ');

  const expandedAliases = new Set();
  for (const [alias, words] of Object.entries(ALIASES)) {
    if (qLower.includes(alias.toLowerCase())) {
      words.forEach((w) => expandedAliases.add(w.toLowerCase()));
    }
  }

  const scored = [];

  for (const [name, data] of Object.entries(schemes)) {
    let score = 0;
    const nameLower = name.toLowerCase();
    const teluguName = (data.telugu_name || '').toLowerCase();
    const keywords = (data.keywords || []).map((k) => k.toLowerCase());
    const category = (data.category || '').toLowerCase();

    // High-weight direct match with current question
    for (const kw of keywords) {
      if (kw.length >= 2 && qLower.includes(kw)) score += 6;
    }

    for (const ea of expandedAliases) {
      if (nameLower.includes(ea) || teluguName.includes(ea) || keywords.includes(ea)) {
        score += 6;
      }
    }

    for (const token of tokens) {
      if (token.length <= 2) continue; // Prevent accidental short substring matching like "hi" matching "child hearing"
      const wordRegex = new RegExp(`\\b${token}\\b`, 'i');
      if (wordRegex.test(teluguName)) score += 5;
      else if (teluguName.includes(token)) score += 3;

      if (wordRegex.test(nameLower)) score += 5;
      else if (nameLower.includes(token)) score += 2;

      if (category.includes(token)) score += 3;
      if (keywords.some((k) => k.includes(token))) score += 4;
    }

    // Low-weight contextual boost from prior conversation
    if (priorUserText) {
      for (const kw of keywords) {
        if (priorUserText.includes(kw)) score += 1.2;
      }
    }

    if (score >= 2) {
      const isEn = lang === 'en';
      const sec = isEn ? data.simplified || {} : data.telugu || {};
      scored.push({
        score,
        scheme_name: name,
        telugu_name: data.telugu_name || name,
        category: data.category || '',
        description: isEn ? data.english_description || sec.description || '' : data.telugu_description || sec.description || '',
        eligibility: sec.eligibility || '',
        benefits: sec.benefits || '',
        documents: sec.documents || '',
        steps: sec.steps || '',
        contact_office: data.contact_office || '',
        official_website: data.official_website || '',
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

// Routes

// Home / Root
app.get('/', (req, res) => {
  const cspNonce = crypto.randomBytes(16).toString('hex');
  const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
  req.session.csrf_token = csrfToken;

  res.render('portal', {
    schemes,
    scheme_names: schemeNames,
    csp_nonce: cspNonce,
    csrf_token: csrfToken,
    auto_open_scheme: null,
  });
});

// Deep link by scheme slug
app.get('/scheme/:slug', (req, res) => {
  const { slug } = req.params;
  const match = findScheme(slug);
  if (!match) {
    return res.redirect('/');
  }

  const cspNonce = crypto.randomBytes(16).toString('hex');
  const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
  req.session.csrf_token = csrfToken;

  res.render('portal', {
    schemes,
    scheme_names: schemeNames,
    csp_nonce: cspNonce,
    csrf_token: csrfToken,
    auto_open_scheme: match.name,
  });
});

// QR Code Generator
app.get('/qr/:slug.png', async (req, res) => {
  const { slug } = req.params;
  const schemeName = slugToScheme[slug];
  if (!schemeName) {
    return res.status(404).send('Scheme not found');
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const targetUrl = `${protocol}://${host}/scheme/${slug}`;

  try {
    const pngBuffer = await QRCode.toBuffer(targetUrl, {
      width: 250,
      margin: 2,
      color: { dark: '#176b5b', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(pngBuffer);
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).send('Failed to generate QR code');
  }
});

// Health and Diagnostics
app.get(['/health', '/healthz'], (req, res) => {
  res.json({ status: 'ok', schemes_loaded: schemeNames.length });
});

app.get('/readyz', (req, res) => {
  res.json({ status: 'ready', database: 'in-memory', schemes: schemeNames.length });
});

app.get('/version', (req, res) => {
  res.json({
    name: 'SmartGovAI',
    version: '1.0.0',
    description: 'SmartGovAI public API for scheme lookup and simplification.',
  });
});

app.get('/api/schemes', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  
  // If batch pagination is requested via query params
  if (req.query.batch || req.query.page || req.query.offset || req.query.limit) {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = req.query.offset ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : ((Math.max(parseInt(req.query.page, 10) || 1, 1) - 1) * limit);
    const category = (req.query.category || '').toLowerCase().trim();
    const level = (req.query.level || '').trim();
    const search = (req.query.search || req.query.q || '').toLowerCase().trim();

    const cacheKey = `scheme:query:${category}:${level}:${search}:${limit}:${offset}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let filtered = schemeNames;

    if (category && category !== 'all') {
      filtered = filtered.filter(name => {
        const cat = (schemes[name]?.category || '').toLowerCase();
        return cat.includes(category);
      });
    }

    if (level && level !== 'all') {
      filtered = filtered.filter(name => schemes[name]?.level === level);
    }

    if (search) {
      filtered = filtered.filter(name => {
        const s = schemes[name];
        if (!s) return false;
        const haystack = `${name} ${s.telugu_name || ''} ${s.category || ''} ${JSON.stringify(s.simplified || {})} ${JSON.stringify(s.telugu || {})}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const page = Math.floor(offset / limit) + 1;
    const slice = filtered.slice(offset, offset + limit);

    const batchSchemes = {};
    const batchList = [];

    slice.forEach(name => {
      const s = schemes[name];
      if (s) {
        batchSchemes[name] = s;
        batchList.push({
          name,
          ...s
        });
      }
    });

    const result = {
      success: true,
      total,
      page,
      limit,
      offset,
      totalPages,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : null,
      nextPage: offset + limit < total ? page + 1 : null,
      count: slice.length,
      schemes: batchSchemes,
      schemesList: batchList
    };

    await setCache(cacheKey, result, 3600);
    return res.json(result);
  }

  const allCached = await getCache('scheme:all');
  if (allCached) {
    return res.json(allCached);
  }

  await setCache('scheme:all', schemes, 3600);
  res.json(schemes);
});

// Dedicated proxy endpoint for viewing official government portals inside present tab iframe
app.get('/api/proxy-portal', async (req, res) => {
  const targetUrl = req.query.url;
  const isEn = req.query.lang === 'en';
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    return res.status(400).send('Invalid or missing URL parameter');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).send('Invalid protocol');
    }
  } catch (e) {
    return res.status(400).send('Invalid URL format');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const proxyRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,te;q=0.8',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const contentType = proxyRes.headers.get('content-type') || 'text/html';

    // Strip frame restriction headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Type-Options');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    if (contentType.includes('text/html')) {
      let bodyHtml = await proxyRes.text();
      // Inject <base href="..."> into <head> so relative assets and paths load properly
      const baseTag = `<base href="${targetUrl}">`;
      if (bodyHtml.includes('<head>')) {
        bodyHtml = bodyHtml.replace('<head>', `<head>${baseTag}`);
      } else if (bodyHtml.includes('<HEAD>')) {
        bodyHtml = bodyHtml.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        bodyHtml = baseTag + bodyHtml;
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(bodyHtml);
    } else {
      res.setHeader('Content-Type', contentType);
      const buffer = await proxyRes.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (err) {
    // If the government portal firewall, state intranet, or SSL blocks server-side proxy,
    // deliver a clean, responsive in-frame fallback page that lets user open it directly in tab
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const safeUrl = targetUrl.replace(/"/g, '&quot;');
    const hostname = parsedUrl.hostname;
    
    return res.send(`
      <!DOCTYPE html>
      <html lang="${isEn ? 'en' : 'te'}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Official Government Portal</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .portal-box {
            background: #ffffff;
            border: 1.5px solid #0d5c4d;
            border-radius: 16px;
            padding: 36px 28px;
            max-width: 540px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(13,92,77,0.1);
          }
          .portal-icon {
            width: 64px;
            height: 64px;
            background: #e6f4ea;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
            border: 2px solid #0d5c4d;
          }
          h2 {
            font-size: 1.35rem;
            color: #0d5c4d;
            margin-bottom: 12px;
            font-weight: 800;
          }
          p {
            font-size: 0.95rem;
            color: #475569;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .url-chip {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            font-family: monospace;
            font-size: 0.88rem;
            color: #0f172a;
            word-break: break-all;
            margin-bottom: 24px;
            display: block;
          }
          .action-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .btn-portal {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #0d5c4d;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.05rem;
            padding: 14px 20px;
            border-radius: 10px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(13,92,77,0.25);
          }
          .btn-portal:hover {
            background: #0a463b;
            transform: translateY(-1px);
          }
          .btn-back-guide {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #f8fafc;
            color: #0d5c4d;
            border: 1.5px solid #0d5c4d;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.95rem;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-back-guide:hover {
            background: #e6f4ea;
          }
          .info-note {
            margin-top: 18px;
            font-size: 0.82rem;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="portal-box">
          <div class="portal-icon">🏛️</div>
          <h2>${isEn ? 'Official Government Portal' : 'అధికారిక ప్రభుత్వ పోర్టల్'}</h2>
          <span class="url-chip">🔒 ${hostname}</span>
          <p>${isEn ? 'This official government health department website has strict firewall security and can be accessed directly in your browser. Click below to enter the portal:' : 'ఈ అధికారిక ప్రభుత్వ ఆరోగ్య శాఖ వెబ్‌సైట్ ప్రత్యేక భద్రతా రక్షణ కలిగి ఉంది. పోర్టల్‌ను నేరుగా తెరవడానికి క్రింది బటన్ నొక్కండి:'}</p>
          <div class="action-group">
            <a href="${safeUrl}" target="_top" class="btn-portal">
              🌐 ${isEn ? 'Open Government Portal Now' : 'అధికారిక వెబ్‌సైట్‌లోకి వెళ్లండి'}
            </a>
            <button type="button" class="btn-back-guide" onclick="if(window.parent && window.parent.closeInAppPortal){window.parent.closeInAppPortal();}else{history.back();}">
              ⬅️ ${isEn ? 'Return to Scheme Guide' : 'తిరిగి పథకం వివరాలకు వెళ్లండి'}
            </button>
          </div>
          <div class="info-note">
            ${isEn ? 'Note: You can use the back button anytime to return to your previous search and scheme.' : 'గమనిక: వెనక్కి (Back) బటన్ నొక్కడం ద్వారా ఎప్పుడైనా మీ మునుపటి పథకం వివరాలకు తిరిగి రావచ్చు.'}
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Dedicated fast summary endpoint for instantaneous dashboard loading
app.get('/api/schemes/summary', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const cacheKey = 'scheme:summary';
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const summary = computeSchemesSummary();
  const responseData = {
    success: true,
    ...summary
  };
  await setCache(cacheKey, responseData, 3600);
  res.json(responseData);
});

// Dedicated batch chunk endpoint for progressive hydration
app.get('/api/schemes/batch', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = req.query.offset !== undefined ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : ((page - 1) * limit);
  const category = (req.query.category || '').toLowerCase().trim();
  const level = (req.query.level || '').trim();
  const search = (req.query.search || req.query.q || '').toLowerCase().trim();

  const cacheKey = `scheme:batch:${category}:${level}:${search}:${limit}:${offset}:${page}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let filtered = schemeNames;

  if (category && category !== 'all') {
    filtered = filtered.filter(name => {
      const cat = (schemes[name]?.category || '').toLowerCase();
      return cat.includes(category);
    });
  }

  if (level && level !== 'all') {
    filtered = filtered.filter(name => schemes[name]?.level === level);
  }

  if (search) {
    filtered = filtered.filter(name => {
      const s = schemes[name];
      if (!s) return false;
      const haystack = `${name} ${s.telugu_name || ''} ${s.category || ''} ${JSON.stringify(s.simplified || {})} ${JSON.stringify(s.telugu || {})}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const slice = filtered.slice(offset, offset + limit);

  const batchSchemes = {};
  const batchList = [];

  slice.forEach(name => {
    const s = schemes[name];
    if (s) {
      batchSchemes[name] = s;
      batchList.push({
        name,
        ...s
      });
    }
  });

  const responseData = {
    success: true,
    total,
    page,
    limit,
    offset,
    totalPages,
    hasMore: offset + limit < total,
    nextOffset: offset + limit < total ? offset + limit : null,
    nextPage: offset + limit < total ? page + 1 : null,
    count: slice.length,
    schemes: batchSchemes,
    schemesList: batchList
  };

  await setCache(cacheKey, responseData, 3600);
  res.json(responseData);
});

app.post('/api/schemes/refresh', async (req, res) => {
  loadSchemesData();
  await syncSchemesFromFirestore();
  invalidateSchemesCache();
  await flushSchemeCache();
  await prewarmCache();
  const summary = computeSchemesSummary();
  res.json({ success: true, schemes_count: schemeNames.length, summary });
});

// Validator to ensure uploaded document is a genuine government health/welfare scheme
function validateIsGovernmentHealthScheme(text = '', filename = '') {
  const combined = `${text} ${filename}`.toLowerCase();

  // Explicit non-government / academic / software / dummy markers
  const nonGovPatterns = [
    /\b(srs\s+to\s+fol|software\s+requirements(\s+specification)?|class\s+object\s+diagram|first\s+order\s+logic|\bfol\b)\b/i,
    /\b(assignment|homework|lab\s+manual|curriculum\s+vitae|\bcv\b|resume)\b/i,
    /\b(syllabus|mid\s+exam|semester|course\s+code|b\.tech|m\.tech|mca|bca|roll\s+no|hall\s+ticket)\b/i,
    /\b(college\s+of\s+engineering|university\s+examination|department\s+of\s+computer\s+science)\b/i,
    /\btable\s+of\s+contents\s+chapter\b/i,
    /\b(lorem\s+ipsum|sample\s+dummy|dummy\s+file|test\s+pdf|dummy\s+document)\b/i
  ];

  for (const pat of nonGovPatterns) {
    if (pat.test(combined)) {
      return {
        isGovtScheme: false,
        reasonTe: 'అప్‌లోడ్ చేసిన ఫైల్‌లో ఎటువంటి ప్రభుత్వ ఆరోగ్య లేదా సంక్షేమ పథకం, అధికారిక జీవో (GO), లేదా ఆరోగ్యశ్రీ మార్గదర్శకాలు లేవు. ఇది అకడమిక్ అసైన్‌మెంట్ లేదా సాధారణ సాంకేతిక పత్రంలా గుర్తించబడింది. దయచేసి అధికారిక ప్రభుత్వ పథకం లేదా జీవో పత్రాన్ని అప్‌లోడ్ చేయండి.',
        reasonEn: 'The uploaded document is not a recognized government health or welfare scheme document. It contains academic or technical content (such as an assignment, software requirements specification, or syllabus). Please upload an official AP or National health scheme document or Government Order (GO).'
      };
    }
  }

  // Check for healthcare / welfare keywords
  const healthKeywords = [
    'aarogya', 'arogya', 'aarogyasri', 'hospital', 'ayushman', 'pm-jay', 'pmjay',
    'health', 'scheme', 'yojana', 'welfare', 'beneficiary', 'treatment', 'medical', 'patient',
    'clinic', 'ration', 'bpl', 'aadhaar', 'pradhan mantri', 'ysr', 'ntr', 'swasthya', 'vaidya',
    'suraksha', 'family welfare', 'maternal', 'g.o', 'government order', 'directorate', 'cashless',
    'surgery', 'medicine', 'doctor', 'inpatient', 'outpatient', 'phc', 'chc', 'sub-centre',
    'reimbursement', 'sanction', 'asara', 'aasara', 'thalli bidda', 'pension kanuka',
    'ఆరోగ్య', 'పథకం', 'ప్రభుత్వ', 'చికిత్స', 'వైద్య', 'ఆసుపత్రి', 'సంక్షేమ', 'లబ్ధిదారు',
    'ఆరోగ్యశ్రీ', 'జీవో', 'రేషన్', 'ఆధార్', 'వైద్యారోగ్య', 'వైద్యులు', 'సహాయం', 'సచివాలయం'
  ];

  let matches = 0;
  for (const kw of healthKeywords) {
    if (combined.includes(kw)) {
      matches++;
    }
  }

  // If there's virtually no healthcare or government welfare terminology in the extracted text
  if (text.length > 50 && matches < 2) {
    return {
      isGovtScheme: false,
      reasonTe: 'అప్‌లోడ్ చేసిన పత్రంలో ప్రభుత్వ ఆరోగ్య లేదా సంక్షేమ పథకాలకు సంబంధించిన సమాచారం లేదు. దయచేసి అధికారిక ప్రభుత్వ పథకం బ్రోచర్, జీవో లేదా ఆరోగ్య కార్డును అప్‌లోడ్ చేయండి.',
      reasonEn: 'The uploaded document does not contain information related to any government health or welfare schemes. Please upload an official government scheme brochure, circular, or health card.'
    };
  }

  return { isGovtScheme: true };
}

// Helper function: Tesseract.js OCR Engine for scanned images and image-based PDFs
async function runTesseractOCR(fileBuffer) {
  try {
    const Tesseract = await import('tesseract.js');
    const tessPromise = Tesseract.default.recognize(fileBuffer, 'eng');
    const tessTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TESS_TIMEOUT')), 6000));
    const { data: { text } } = await Promise.race([tessPromise, tessTimeout]);
    return (text || '').trim();
  } catch (err) {
    console.warn('Tesseract.js OCR engine note:', err.message);
    return '';
  }
}

// Formatted PDF Document Download Endpoint with official scheme source links
app.get(['/api/download-scheme-pdf', '/download-scheme-pdf'], (req, res) => {
  const schemeName = (req.query.scheme_name || req.query.name || '').trim();
  const lang = req.query.lang || 'te';
  const isEn = lang === 'en';

  let matched = null;
  if (schemeName) {
    matched = catalogData.schemes.find(s => 
      (s.scheme_name && s.scheme_name.toLowerCase() === schemeName.toLowerCase()) || 
      (s.telugu_name && s.telugu_name.toLowerCase() === schemeName.toLowerCase())
    );
  }
  if (!matched) {
    matched = catalogData.schemes[0];
  }

  const title = isEn ? (matched.scheme_name || schemeName) : (matched.telugu_name || matched.scheme_name || schemeName);
  const altTitle = isEn ? (matched.telugu_name || '') : (matched.scheme_name || '');
  const sourceUrl = matched.official_website || matched.source_url || 'https://ysraarogyasri.ap.gov.in';
  const level = matched.level || 'Andhra Pradesh';
  const category = matched.category || (isEn ? 'Healthcare Welfare Scheme' : 'ఆరోగ్య సంక్షేమ పథకం');
  
  const elig = isEn 
    ? (matched.simplified?.eligibility || matched.english_description || 'Resident families of Andhra Pradesh with valid Rice Card or annual family income below state limit.')
    : (matched.telugu?.eligibility || matched.telugu_description || 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు, చెల్లుబాటు అయ్యే వైట్ రేషన్ / బియ్యం కార్డు ఉన్న కుటుంబాలు.');

  const benefits = isEn
    ? (matched.simplified?.benefits || 'Cashless hospitalization, surgery, and free diagnostic tests in empanelled network hospitals.')
    : (matched.telugu?.benefits || 'నెట్‌వర్క్ ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స, శస్త్రచికిత్సలు మరియు ఉచిత వైద్య పరీక్షలు.');

  const steps = isEn
    ? (matched.simplified?.steps || '1. Visit nearest Grama/Ward Sachivalayam or Network Hospital.\n2. Present Aadhaar & Rice Card at Aarogya Mithra desk.\n3. Get electronic pre-authorization for cashless treatment.')
    : (matched.telugu?.steps || '1. సమీప గ్రామ/వార్డు సచివాలయం లేదా ఆరోగ్యశ్రీ నెట్‌వర్క్ ఆసుపత్రిని సందర్శించండి.\n2. ఆరోగ్య మిత్ర హెల్ప్ డెస్క్ వద్ద ఆధార్ మరియు రేషన్ కార్డును చూపించండి.\n3. ఉచితంగా ఈ-ప్రీఆథరైజేషన్ పొంది నగదు రహిత చికిత్స ప్రారంభించండి.');

  const docsList = [
    isEn ? 'Aadhaar Card (Beneficiary / Patient)' : 'లబ్ధిదారుని ఆధార్ కార్డు',
    isEn ? 'Rice Card / White Ration Card / Health Card' : 'బియ్యం కార్డు / తెల్ల రేషన్ కార్డు / ఆరోగ్య కార్డు',
    isEn ? 'Doctor Referral / Hospital Admission Slip' : 'వైద్యుల రిఫరల్ / ఆసుపత్రి అడ్మిషన్ పత్రం'
  ];

  const contact = matched.telugu?.contact_office || matched.contact_office || (isEn ? 'Grama/Ward Sachivalayam, Network Hospitals, Toll-Free 104 / 1902' : 'గ్రామ/వార్డు సచివాలయం, నెట్‌వర్క్ ఆసుపత్రులు, టోల్ ఫ్రీ 104 / 1902');
  const printDate = new Date().toLocaleDateString(isEn ? 'en-IN' : 'te-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SmartGovAI Official Summary</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        * { box-sizing: border-box; }
        body {
            font-family: ${isEn ? 'system-ui, -apple-system, sans-serif' : '"Noto Sans Telugu", system-ui, sans-serif'};
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
            font-size: 11pt;
        }
        .pdf-card {
            max-width: 820px;
            margin: 0 auto;
            border: 2.5px solid #0284c7;
            border-radius: 12px;
            padding: 28px;
            background: #ffffff;
            box-shadow: 0 4px 20px rgba(2, 132, 199, 0.08);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .header-seal {
            font-size: 32px;
            margin-bottom: 4px;
        }
        .header-sub {
            font-size: 9pt;
            font-weight: 800;
            color: #0284c7;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .header-main {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
        }
        .title-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .title-text {
            font-size: 16pt;
            font-weight: 800;
            color: #0369a1;
            margin: 0 0 4px 0;
        }
        .alt-title {
            font-size: 11pt;
            color: #475569;
            font-weight: 600;
        }
        .badge-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .badge {
            background: #0284c7;
            color: #ffffff;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 8.5pt;
            font-weight: 700;
        }
        .badge-outline {
            background: #ffffff;
            color: #0369a1;
            border: 1px solid #0284c7;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 8.5pt;
            font-weight: 700;
        }
        .section-box {
            margin-bottom: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0284c7;
            border-radius: 8px;
            padding: 14px 18px;
        }
        .section-heading {
            font-size: 11pt;
            font-weight: 800;
            color: #0369a1;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .doc-checklist {
            margin: 8px 0 0 0;
            padding-left: 20px;
        }
        .doc-checklist li {
            margin-bottom: 4px;
        }
        .source-link-box {
            background: #eff6ff;
            border: 1.5px solid #60a5fa;
            border-radius: 10px;
            padding: 14px 18px;
            margin-top: 22px;
        }
        .source-heading {
            font-size: 10pt;
            font-weight: 800;
            color: #1e40af;
            margin-bottom: 4px;
        }
        .source-url-text {
            color: #2563eb;
            font-weight: 700;
            font-size: 10pt;
            word-break: break-all;
            text-decoration: underline;
        }
        .footer {
            margin-top: 24px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            color: #64748b;
        }
        @media print {
            body { padding: 0; }
            .pdf-card { border: none; box-shadow: none; max-width: 100%; padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: center; margin-bottom: 16px;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 24px; font-weight: 800; font-size: 1rem; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(2,132,199,0.25);">
            🖨️ ${isEn ? 'Print / Save as PDF' : 'పిడిఎఫ్ ముద్రణ / ప్రింట్ చేయండి'}
        </button>
    </div>

    <div class="pdf-card">
        <div class="header">
            <div class="header-seal">🏛️</div>
            <div class="header-sub">Government of Andhra Pradesh • Healthcare & Welfare Portal</div>
            <div class="header-main">SmartGovAI Official Scheme Briefing & Document Checklist</div>
        </div>

        <div class="title-box">
            <div class="title-text">${title}</div>
            ${altTitle ? `<div class="alt-title">${altTitle}</div>` : ''}
            <div class="badge-row">
                <span class="badge">📍 ${level}</span>
                <span class="badge-outline">🏥 ${category}</span>
                <span class="badge"> Verified Government Record</span>
            </div>
        </div>

        <div class="section-box">
            <div class="section-heading">🎯 ${isEn ? 'Eligibility Requirements' : 'అర్హత నిబంధనలు'}</div>
            <div>${elig}</div>
        </div>

        <div class="section-box">
            <div class="section-heading">💊 ${isEn ? 'Key Benefits & Coverage' : 'పథకం ఉచిత ప్రయోజనాలు & చికిత్సలు'}</div>
            <div>${benefits}</div>
        </div>

        <div class="section-box">
            <div class="section-heading">📋 ${isEn ? 'Required Document Checklist' : 'అవసరమైన పత్రాల చెక్‌లిస్ట్'}</div>
            <ul class="doc-checklist">
                ${docsList.map(d => `<li><strong>${d}</strong></li>`).join('')}
            </ul>
        </div>

        <div class="section-box">
            <div class="section-heading">🚀 ${isEn ? 'How to Apply & Contact Desk' : 'దరఖాస్తు విధానం & సంప్రదించాల్సిన కార్యాలయం'}</div>
            <div style="white-space: pre-line;">${steps}</div>
            <div style="margin-top: 8px; font-weight: 700; color: #0369a1;">📞 ${contact}</div>
        </div>

        <div class="source-link-box">
            <div class="source-heading">🌐 ${isEn ? 'Official Government Portal Source Link' : 'అధికారిక ప్రభుత్వ మూల వెబ్‌సైట్ లింక్'}:</div>
            <a href="${sourceUrl}" target="_blank" class="source-url-text">${sourceUrl}</a>
            <div style="font-size: 8pt; color: #475569; margin-top: 4px;">
                ${isEn ? 'Direct link to government portal, G.O. guidelines, and network hospital empanelment.' : 'అధికారిక జిఒలు, ఆరోగ్యశ్రీ నెట్‌వర్క్ ఆసుపత్రుల జాబితా మరియు ప్రభుత్వ ఆదేశాలకు నేరుగా లింక్.'}
            </div>
        </div>

        <div class="footer">
            <span> SmartGovAI Healthcare Advisor • AP State Portal</span>
            <span>📅 Generated: ${printDate}</span>
        </div>
    </div>

    <script>
        // Auto trigger print preview if requested
        if (window.location.search.indexOf('autoprint=true') !== -1) {
            window.onload = function() { setTimeout(function() { window.print(); }, 400); };
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Scheme Details and PDF / Scanned Image Document Simplification with OCR
app.post('/simplify', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'ఫైల్ పరిమాణం 20MB కంటే ఎక్కువగా ఉంది. దయచేసి 20MB లోపు ఉన్న PDF లేదా ఇమేజ్ ఫైల్‌ను ఎంచుకోండి. (File size exceeds 20MB limit)'
        });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: 'దయచేసి సరైన PDF లేదా ఇమేజ్ ఫైల్ (PDF, JPG, PNG, WebP) ను ఎంచుకోండి. (Please upload a valid PDF or Image document)'
        });
      }
      return res.status(400).json({ error: `అప్‌లోడ్ లోపం: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    // 1. If uploaded document file (PDF, Scanned PDF, or Image)
    if (req.file) {
      const consent = req.body.consent;
      if (!consent || consent !== 'true') {
        return res.status(400).json({ error: 'Consent is required before uploading documents.' });
      }

      const mimeType = req.file.mimetype || 'application/pdf';
      const isImage = mimeType.startsWith('image/');
      let extractedText = '';
      let isImagedDoc = isImage;

      // If PDF, extract embedded text using our dedicated pdfProcessingService
      if (!isImage) {
        try {
          const pdfRes = await extractTextFromPdf(req.file.buffer);
          extractedText = pdfRes.text || '';
        } catch (pdfErr) {
          console.warn('[server] pdf-parse extraction warning:', pdfErr.message);
        }
        // If extracted text has content, it is a text-based digital document
        if (extractedText && extractedText.length >= 20) {
          isImagedDoc = false;
        } else {
          isImagedDoc = true;
          // Fallback to Tesseract.js OCR engine for scanned image-based PDFs
          const ocrText = await runTesseractOCR(req.file.buffer);
          if (ocrText) {
            extractedText = ocrText;
          }
        }
      }

      // 1. Initial Validation: Check if the text or filename indicates non-government / academic / dummy material
      if (extractedText && extractedText.length > 20) {
        const textVal = validateIsGovernmentHealthScheme(extractedText, req.file.originalname);
        if (!textVal.isGovtScheme) {
          return res.status(400).json({
            status: 'rejected',
            is_not_govt_scheme: true,
            error: textVal.reasonTe,
            error_en: textVal.reasonEn,
            message: textVal.reasonTe,
            message_en: textVal.reasonEn
          });
        }
      }

      const schemeTitle = req.body.scheme_name || (isImage ? 'స్కాన్ చేసిన ఇమేజ్ పత్రం (Scanned Document)' : 'అప్‌లోడ్ చేసిన PDF పత్రం (Uploaded PDF)');
      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      const cacheKey = `simplify:${fileHash}:${schemeTitle}`;
      
      const cachedResult = null; // await getCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }

      const ai = getGeminiClient();

      // Step A: If Gemini AI available, use Multimodal Vision / OCR or Text extraction
      if (ai) {
        try {
          const basePrompt = `You are SmartGovAI, an authoritative Andhra Pradesh healthcare scheme analyst and OCR interpreter.
Analyze this uploaded document. FIRST, determine if this is an official government healthcare or welfare scheme document, Government Order (GO), public health circular, Aarogyasri guideline, or genuine hospital medical record.
If the document is an academic assignment, software specification, homework, syllabus, resume, dummy sample, or unrelated technical text that has nothing to do with government healthcare schemes, you MUST return:
{
  "is_government_scheme": false,
  "rejection_reason_te": "అప్‌లోడ్ చేసిన ఫైల్ ప్రభుత్వ ఆరోగ్య పథకం లేదా అధికారిక జీవో (GO) కాదు. ఇది అకడమిక్ అసైన్‌మెంట్ లేదా సాధారణ సాంకేతిక పత్రంలా గుర్తించబడింది.",
  "rejection_reason_en": "The uploaded file is not a government health or welfare scheme document. Please upload an official AP or National healthcare scheme brochure, GO, or Aarogyasri document."
}

If it IS a valid healthcare/welfare scheme or medical document, extract the key details and return strictly a JSON object with this exact structure:
{
  "is_government_scheme": true,
  "scheme_name": "Identified Official Scheme or Document Title (English)",
  "telugu_name": "పథకం లేదా పత్రం పేరు (తెలుగు)",
  "category": "Healthcare Category (e.g. Tertiary Hospital Care, Maternal Care, Financial Assistance)",
  "level": "Andhra Pradesh",
  "benefit_amount": "Financial coverage or assistance amount (e.g. Up to ₹25 Lakhs or Free treatment)",
  "benefit_amount_te": "ఆర్థిక రక్షణ పరిమితి లేదా ఉచిత చికిత్స వివరాలు",
  "simplified": {
    "eligibility": "Who is eligible to apply for this scheme/benefit? (English)",
    "benefits": "What coverage, medical treatments, or financial aid is provided? (English)",
    "documents": "What documents are required to apply? (English)",
    "steps": "Step-by-step process on how and where to apply (English)"
  },
  "telugu": {
    "eligibility": "ఎవరు అర్హులు? (తెలుగు వివరణ)",
    "benefits": "ఏమి ప్రయోజనాలు మరియు ఉచిత చికిత్సలు లభిస్తాయి? (తెలుగు వివరణ)",
    "documents": "కావలసిన పత్రాలు / సర్టిఫికెట్లు (తెలుగు వివరణ)",
    "steps": "ఎక్కడ మరియు ఎలా దరఖాస్తు చేసుకోవాలి? (తెలుగు వివరణ)"
  },
  "required_documents": [
    { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
    { "name": "Rice Card / White Ration Card", "name_te": "బియ్యం కార్డు / తెల్ల రేషన్ కార్డు", "optional": false }
  ],
  "eligibility_questions": [
    { "question_te": "మీ వద్ద ఆంధ్రప్రదేశ్ బియ్యం కార్డు లేదా రేషన్ కార్డు ఉందా?", "question_en": "Do you hold a valid AP Rice Card or Ration Card?", "weight": "critical" }
  ]
}`;

          let parts;
          if (isImage) {
            parts = [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: req.file.buffer.toString('base64'),
                },
              },
              {
                text: `${basePrompt}\n\nNote: Perform optical character recognition (OCR) on all visual Telugu and English texts, tables, and headings in this document image.`
              }
            ];
          } else if (isImagedDoc) {
            // Scanned PDF
            parts = [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: req.file.buffer.toString('base64'),
                },
              },
              {
                text: `${basePrompt}\n\nNote: Perform optical character recognition (OCR) on all visual Telugu and English texts in this scanned PDF.`
              }
            ];
          } else {
            // Text PDF
            const docSnippet = extractedText.slice(0, 4000);
            parts = [
              {
                text: `${basePrompt}\n\nDocument Text Content:\n${docSnippet}`
              }
            ];
          }

          const geminiCall = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: parts,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 950,
            },
          });

          // Fast 6.5-second timeout for responsive document analysis
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 6500)
          );

          const response = await Promise.race([geminiCall, timeoutPromise]);
          const rawText = (response.text || '').trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);

          if (parsed) {
            if (parsed.is_government_scheme === false) {
              return res.status(400).json({
                status: 'rejected',
                is_not_govt_scheme: true,
                error: parsed.rejection_reason_te || 'అప్‌లోడ్ చేసిన పత్రం ప్రభుత్వ ఆరోగ్య లేదా సంక్షేమ పథకానికి సంబంధించినది కాదు.',
                error_en: parsed.rejection_reason_en || 'The uploaded document is not a recognized government health or welfare scheme.',
                message: parsed.rejection_reason_te || 'అప్‌లోడ్ చేసిన పత్రం ప్రభుత్వ ఆరోగ్య లేదా సంక్షేమ పథకానికి సంబంధించినది కాదు.',
                message_en: parsed.rejection_reason_en || 'The uploaded document is not a recognized government health or welfare scheme.'
              });
            }

            if (parsed.simplified || parsed.telugu) {
              const reqId = logRequest(schemeTitle, isImagedDoc ? 'ocr_upload' : 'pdf_upload');
              const detectedSchemeName = parsed.scheme_name || schemeTitle;
              const finalResponse = {
                request_id: reqId,
                scheme_name: detectedSchemeName,
                telugu_name: parsed.telugu_name || schemeTitle,
                level: parsed.level || 'Andhra Pradesh',
                category: parsed.category || 'Healthcare Welfare Scheme',
                benefit_amount: parsed.benefit_amount || 'Free Cashless Healthcare',
                benefit_amount_te: parsed.benefit_amount_te || 'ఉచిత నగదు రహిత చికిత్స',
                required_documents: Array.isArray(parsed.required_documents) && parsed.required_documents.length > 0 
                  ? parsed.required_documents 
                  : [
                      { name: "Aadhaar Card", name_te: "ఆధార్ కార్డు", optional: false },
                      { name: "Rice Card / White Ration Card", name_te: "బియ్యం కార్డు / తెల్ల రేషన్ కార్డు", optional: false },
                      { name: "Doctor Referral / Prescription", name_te: "వైద్య పత్రాలు / ప్రిస్క్రిప్షన్", optional: true }
                    ],
                eligibility_questions: Array.isArray(parsed.eligibility_questions) && parsed.eligibility_questions.length > 0
                  ? parsed.eligibility_questions
                  : [
                      { question_te: "మీరు ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులా మరియు బియ్యం కార్డు కలిగి ఉన్నారా?", question_en: "Are you a resident of AP holding a valid Rice Card?", weight: "critical" },
                      { question_te: "ఈ పత్రంలో పేర్కొన్న అర్హత ప్రమాణాలను మీరు కలిగి ఉన్నారా?", question_en: "Do you meet the criteria specified in this document?", weight: "high" }
                    ],
                source_name: isImagedDoc ? 'Scanned Document (OCR Analyzed)' : 'Uploaded Document (Parsed)',
                source_url: '',
                is_ai_generated: true,
                is_ocr_processed: isImagedDoc,
                simplified: parsed.simplified || {
                  eligibility: 'Eligible residents of Andhra Pradesh according to document provisions.',
                  benefits: 'Free medical treatment, diagnostic tests, or government welfare benefits.',
                  documents: 'Aadhaar Card, White Ration / Rice Card, and Medical Records.',
                  steps: 'Apply at nearest Grama Sachivalayam, Village Clinic, or empanelled hospital.'
                },
                telugu: parsed.telugu || {
                  eligibility: 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు నిబంధనల ప్రకారం అర్హులైన కుటుంబాలు.',
                  benefits: 'ఉచిత వైద్య సేవలు, పరీక్షలు లేదా నిర్దేశిత ఆసుపత్రులలో నగదు రహిత చికిత్స.',
                  documents: 'ఆధార్ కార్డు, బియ్యం కార్డు / రేషన్ కార్డు, డాక్టర్ ప్రిస్క్రిప్షన్ లేదా వైద్య నివేదికలు.',
                  steps: 'సమీప గ్రామ సచివాలయం, వైఎస్సార్ విలేజ్ క్లినిక్ లేదా PHC కి వెళ్లి దరఖాస్తు చేసుకోవచ్చు.'
                },
                voice_url: null,
              };
              
              await setCache(cacheKey, finalResponse, 3600);
              return res.json(finalResponse);
            }
          }
        } catch (geminiErr) {
          console.warn('Gemini PDF/OCR processing fallback:', geminiErr.message);
        }
      }

      // Step B: Offline / Grounded Catalog Fallback for Documents
      let matchedCatalogScheme = null;
      const combinedText = (extractedText || '') + ' ' + (req.file.originalname || '');

      // Check for known AP scheme matches in the document
      const schemeKeys = Object.keys(schemes);
      for (const key of schemeKeys) {
        const sc = schemes[key];
        const enName = (key || '').toLowerCase();
        const teName = (sc.telugu_name || '').toLowerCase();
        const lowText = combinedText.toLowerCase();
        if (lowText.includes(enName) || (teName && combinedText.includes(sc.telugu_name))) {
          matchedCatalogScheme = sc;
          break;
        }
      }

      // If document matches an official scheme, return grounded verified details
      if (matchedCatalogScheme) {
        const reqId = logRequest(matchedCatalogScheme.telugu_name || schemeTitle, 'doc_catalog_match');
        return res.json({
          request_id: reqId,
          scheme_name: matchedCatalogScheme.telugu_name || schemeTitle,
          level: matchedCatalogScheme.level || 'Andhra Pradesh State Scheme',
          category: matchedCatalogScheme.category || 'Healthcare',
          source_name: 'Verified AP Government Catalog (Document Matched)',
          source_url: matchedCatalogScheme.source_url || '',
          is_ai_generated: false,
          is_ocr_processed: isImagedDoc,
          simplified: matchedCatalogScheme.simplified,
          telugu: matchedCatalogScheme.telugu,
          voice_url: matchedCatalogScheme.voice_url || null,
        });
      }

      // Step C: Generic intelligent synthesis from extracted text or OCR with STRICT validation
      let localOcrText = '';
      if (isImage) {
        try {
          const Tesseract = await import('tesseract.js');
          const tessPromise = Tesseract.default.recognize(req.file.buffer, 'eng');
          const tessTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TESS_TIMEOUT')), 5000));
          const { data: { text } } = await Promise.race([tessPromise, tessTimeout]);
          localOcrText = text || '';
        } catch (tessErr) {
          console.warn('Local tesseract fallback note:', tessErr.message);
        }
      }

      const totalDocText = (extractedText || localOcrText || '').trim();
      const finalVal = validateIsGovernmentHealthScheme(totalDocText, req.file.originalname);
      if (!finalVal.isGovtScheme) {
        return res.status(400).json({
          status: 'rejected',
          is_not_govt_scheme: true,
          error: finalVal.reasonTe,
          error_en: finalVal.reasonEn,
          message: finalVal.reasonTe,
          message_en: finalVal.reasonEn
        });
      }

      const cleanDocTitle = (req.file.originalname || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      const snippet = totalDocText.slice(0, 300).trim();
      const reqId = logRequest(schemeTitle, 'doc_upload_fallback');
      return res.json({
        request_id: reqId,
        scheme_name: cleanDocTitle || schemeTitle,
        level: 'Uploaded Document',
        category: 'Health Document',
        source_name: isImagedDoc ? 'Scanned Document (OCR Extracted)' : 'Government PDF Document',
        source_url: '',
        is_ai_generated: true,
        is_ocr_processed: isImagedDoc,
        simplified: {
          eligibility: snippet ? `Extracted from document: "${snippet.slice(0, 150)}..." Applicable to residents of Andhra Pradesh meeting state criteria.` : 'All eligible residents of Andhra Pradesh as specified in the uploaded government order / report.',
          benefits: 'Cashless inpatient treatment, diagnostic tests, free medicines, or designated financial assistance under AP Health Dept.',
          documents: 'Aadhaar Card, Rice Card / BPL Ration Card, Doctor Prescription / Medical Records, and Bank Passbook (if financial benefit).',
          steps: 'Visit your nearest Ward/Village Secretariat (గ్రామ సచివాలయం), Primary Health Centre (PHC), or empanelled network hospital with original documents.',
        },
        telugu: {
          eligibility: snippet ? `పత్రం నుండి గ్రహించిన సమాచారం: "${snippet.slice(0, 150)}..." ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు సంబంధిత నిబంధనల ప్రకారం అర్హులైన కుటుంబాలు.` : 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు ప్రభుత్వ మార్గదర్శకాల ప్రకారం అర్హులైన కుటుంబాలు.',
          benefits: 'అధికారిక ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స, ల్యాబ్ పరీక్షలు, మందులు మరియు వైద్య సహాయం.',
          documents: 'ఆధార్ కార్డు, బియ్యం కార్డు / రేషన్ కార్డు, డాక్టర్ ప్రిస్క్రిప్షన్ లేదా వైద్య నివేదికలు, బ్యాంక్ ఖాతా వివరాలు.',
          steps: 'సమీప గ్రామ సచివాలయం, వైఎస్సార్ విలేజ్ క్లినిక్ లేదా నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్యమిత్రను సంప్రదించండి.',
        },
        voice_url: null,
      });
    }

    // 2. If Scheme Name requested via JSON body
    const schemeName = req.body.scheme_name;
    if (!schemeName) {
      return res.status(400).json({ error: 'దయచేసి పథకం పేరును ఎంచుకోండి.' });
    }

    const cacheKey = `scheme:detail:${encodeURIComponent(schemeName)}`;
    const cachedDetail = await getCache(cacheKey);
    if (cachedDetail) {
      return res.json(cachedDetail);
    }

    const match = findScheme(schemeName);
    if (!match) {
      return res.status(404).json({ error: 'పథకం కనుగొనబడలేదు.' });
    }

    const resolvedSchemeName = match.name;
    const schemeData = match.data;

    const reqId = logRequest(resolvedSchemeName, 'catalog');

    // Check for cached audio or format static path
    let voiceUrl = schemeData.voice_url || null;
    if (!voiceUrl && schemeData.audio_file) {
      const cleanAudio = schemeData.audio_file.replace(/^(\/?static\/)?/i, '').replace(/^\/+/, '');
      voiceUrl = `/public/${cleanAudio}`;
    }

    const responsePayload = {
      request_id: reqId,
      scheme_name: resolvedSchemeName,
      level: schemeData.level || 'Andhra Pradesh',
      category: schemeData.category || 'Health',
      source_name: schemeData.source_name || 'Government of Andhra Pradesh',
      source_url: schemeData.official_website || schemeData.source_url || '',
      is_ai_generated: false,
      simplified: schemeData.simplified || {},
      telugu: schemeData.telugu || {},
      voice_url: voiceUrl,
    };

    await setCache(cacheKey, responsePayload, 86400);
    return res.json(responsePayload);
  } catch (err) {
    console.error('Error in /simplify:', err);
    res.status(500).json({ error: 'సర్వర్ లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.' });
  }
});

// Chunk-based SSE stream for document upload processing
app.post('/simplify-stream', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'ఫైల్ పరిమాణం 20MB కంటే ఎక్కువగా ఉంది. దయచేసి 20MB లోపు ఉన్న PDF లేదా ఇమేజ్ ఫైల్‌ను ఎంచుకోండి.' });
      }
      return res.status(400).json({ error: `అప్‌లోడ్ లోపం: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  try {
    if (!req.file) {
      sendEvent('error', { error: 'No document file provided.' });
      return res.end();
    }

    const consent = req.body.consent;
    if (!consent || consent !== 'true') {
      sendEvent('error', { error: 'Consent is required before uploading documents.' });
      return res.end();
    }

    sendEvent('progress', {
      stage: 'extracting',
      pct: 20,
      badge: 'Ingested',
      title: 'Parsing PDF Document Chunks...',
      sub: `Loaded ${Math.round(req.file.size / 1024)} KB. Extracting text streams & structure...`
    });

    const mimeType = req.file.mimetype || 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    let extractedText = '';
    let isImagedDoc = isImage;

    if (!isImage) {
      try {
        const pdfRes = await extractTextFromPdf(req.file.buffer);
        extractedText = pdfRes.text || '';
      } catch (pdfErr) {
        console.warn('[server] pdf-parse extraction warning in stream:', pdfErr.message);
      }
      if (extractedText && extractedText.length >= 20) {
        isImagedDoc = false;
      } else {
        isImagedDoc = true;
        sendEvent('progress', {
          stage: 'ocr_ingest',
          pct: 35,
          badge: 'Tesseract OCR',
          title: 'Running Tesseract.js OCR Engine...',
          sub: 'Extracting optical characters from scanned PDF pages...'
        });
        const ocrText = await runTesseractOCR(req.file.buffer);
        if (ocrText) {
          extractedText = ocrText;
        }
      }
    }

    if (extractedText && extractedText.length > 20) {
      const textVal = validateIsGovernmentHealthScheme(extractedText, req.file.originalname);
      if (!textVal.isGovtScheme) {
        sendEvent('error', {
          status: 'rejected',
          is_not_govt_scheme: true,
          error: textVal.reasonTe,
          error_en: textVal.reasonEn,
          message: textVal.reasonTe,
          message_en: textVal.reasonEn
        });
        return res.end();
      }

      sendEvent('progress', {
        stage: 'validating',
        pct: 50,
        badge: 'Verified',
        title: `Extracted ${extractedText.length} Characters`,
        sub: `Verified AP government document structure (~${Math.ceil(extractedText.length / 800)} pages).`
      });
    } else {
      sendEvent('progress', {
        stage: 'ocr_ingest',
        pct: 45,
        badge: 'OCR Stream',
        title: isImage ? 'Scanned Image OCR' : 'Scanned PDF (Multimodal Vision OCR)',
        sub: 'Routing scanned document to Gemini Multimodal OCR Vision pipeline...'
      });
    }

    sendEvent('progress', {
      stage: 'analyzing',
      pct: 78,
      badge: 'Analyzing',
      title: 'Interpreting Scheme Criteria with Gemini AI...',
      sub: 'Synthesizing eligibility rules, hospital coverage limits & required documents...'
    });

    const schemeTitle = req.body.scheme_name || (isImage ? 'స్కాన్ చేసిన ఇమేజ్ పత్రం (Scanned Document)' : 'అప్‌లోడ్ చేసిన PDF పత్రం (Uploaded PDF)');
    const ai = getGeminiClient();
    let finalResponse = null;

    if (ai) {
      try {
        const basePrompt = `You are SmartGovAI, an authoritative Andhra Pradesh healthcare scheme analyst and OCR interpreter.
Analyze this uploaded document. FIRST, determine if this is an official government healthcare or welfare scheme document, Government Order (GO), public health circular, Aarogyasri guideline, or genuine hospital medical record.
If the document is an academic assignment, software specification, homework, syllabus, resume, dummy sample, or unrelated technical text that has nothing to do with government healthcare schemes, you MUST return:
{
  "is_government_scheme": false,
  "rejection_reason_te": "అప్‌లోడ్ చేసిన ఫైల్ ప్రభుత్వ ఆరోగ్య పథకం లేదా అధికారిక జీవో (GO) కాదు.",
  "rejection_reason_en": "The uploaded file is not a government health or welfare scheme document."
}

If it IS a valid healthcare/welfare scheme or medical document, extract key details and return JSON:
{
  "is_government_scheme": true,
  "scheme_name": "Official Scheme Name (English)",
  "telugu_name": "పథకం పేరు (తెలుగు)",
  "category": "Healthcare Category",
  "level": "Andhra Pradesh",
  "benefit_amount": "Financial coverage or assistance amount",
  "benefit_amount_te": "ఆర్థిక రక్షణ పరిమితి లేదా ఉచిత చికిత్స వివరాలు",
  "simplified": {
    "eligibility": "Who is eligible (English)",
    "benefits": "What coverage is provided (English)",
    "documents": "What documents required (English)",
    "steps": "Step by step application process (English)"
  },
  "telugu": {
    "eligibility": "ఎవరు అర్హులు (తెలుగు)",
    "benefits": "ఏమి ప్రయోజనాలు (తెలుగు)",
    "documents": "కావలసిన పత్రాలు (తెలుగు)",
    "steps": "ఎలా దరఖాస్తు చేయాలి (తెలుగు)"
  },
  "required_documents": [
    { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
    { "name": "Rice Card / White Ration Card", "name_te": "బియ్యం కార్డు / తెల్ల రేషన్ కార్డు", "optional": false }
  ]
}`;

        let parts;
        if (isImage) {
          parts = [
            { inlineData: { mimeType: mimeType, data: req.file.buffer.toString('base64') } },
            { text: `${basePrompt}\n\nNote: Perform optical character recognition (OCR) on all visual text in this document image.` }
          ];
        } else if (isImagedDoc) {
          parts = [
            { inlineData: { mimeType: 'application/pdf', data: req.file.buffer.toString('base64') } },
            { text: `${basePrompt}\n\nNote: Perform optical character recognition (OCR) on all visual text in this scanned PDF.` }
          ];
        } else {
          parts = [{ text: `${basePrompt}\n\nDocument Text Content:\n${extractedText.slice(0, 4000)}` }];
        }

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: parts,
          config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 950 }
        });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 6500));
        const response = await Promise.race([geminiCall, timeoutPromise]);
        const rawText = (response.text || '').trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);

        if (parsed) {
          if (parsed.is_government_scheme === false) {
            sendEvent('error', {
              status: 'rejected',
              is_not_govt_scheme: true,
              error: parsed.rejection_reason_te || 'అప్‌లోడ్ చేసిన పత్రం ప్రభుత్వ ఆరోగ్య పథకం కాదు.',
              error_en: parsed.rejection_reason_en || 'The uploaded document is not a recognized government health or welfare scheme.',
              message: parsed.rejection_reason_te || 'అప్‌లోడ్ చేసిన పత్రం ప్రభుత్వ ఆరోగ్య పథకం కాదు.',
              message_en: parsed.rejection_reason_en || 'The uploaded document is not a recognized government health or welfare scheme.'
            });
            return res.end();
          }

          if (parsed.simplified || parsed.telugu) {
            const reqId = logRequest(parsed.scheme_name || schemeTitle, isImagedDoc ? 'ocr_stream' : 'pdf_stream');
            finalResponse = {
              request_id: reqId,
              scheme_name: parsed.scheme_name || schemeTitle,
              telugu_name: parsed.telugu_name || schemeTitle,
              level: parsed.level || 'Andhra Pradesh',
              category: parsed.category || 'Healthcare Welfare Scheme',
              benefit_amount: parsed.benefit_amount || 'Free Cashless Healthcare',
              benefit_amount_te: parsed.benefit_amount_te || 'ఉచిత నగదు రహిత చికిత్స',
              required_documents: Array.isArray(parsed.required_documents) && parsed.required_documents.length > 0 ? parsed.required_documents : [
                { name: "Aadhaar Card", name_te: "ఆధార్ కార్డు", optional: false },
                { name: "Rice Card / White Ration Card", name_te: "బియ్యం కార్డు / తెల్ల రేషన్ కార్డు", optional: false }
              ],
              source_name: isImagedDoc ? 'Scanned Document (OCR Analyzed)' : 'Uploaded Document (Stream Parsed)',
              source_url: '',
              is_ai_generated: true,
              is_ocr_processed: isImagedDoc,
              simplified: parsed.simplified,
              telugu: parsed.telugu,
              voice_url: null
            };
          }
        }
      } catch (gemErr) {
        console.warn('Gemini stream analysis fallback:', gemErr.message);
      }
    }

    if (!finalResponse) {
      const snippet = extractedText ? extractedText.slice(0, 300) : '';
      const reqId = logRequest(schemeTitle, 'stream_fallback');
      finalResponse = {
        request_id: reqId,
        scheme_name: schemeTitle,
        telugu_name: schemeTitle,
        level: 'Uploaded Document',
        category: 'Health Document',
        source_name: isImagedDoc ? 'Scanned Document (OCR Extracted)' : 'Government PDF Document',
        source_url: '',
        is_ai_generated: true,
        is_ocr_processed: isImagedDoc,
        simplified: {
          eligibility: snippet ? `Extracted snippet: "${snippet.slice(0, 120)}...". Applicable to residents of AP.` : 'Eligible residents of Andhra Pradesh according to document provisions.',
          benefits: 'Free medical treatment, diagnostic tests, or government welfare benefits.',
          documents: 'Aadhaar Card, White Ration / Rice Card, and Medical Records.',
          steps: 'Apply at nearest Grama Sachivalayam, Village Clinic, or empanelled hospital.'
        },
        telugu: {
          eligibility: snippet ? `గ్రహించిన సారాంశం: "${snippet.slice(0, 120)}...". అర్హులైన నివాసితులు.` : 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు నిబంధనల ప్రకారం అర్హులైన కుటుంబాలు.',
          benefits: 'ఉచిత వైద్య సేవలు, పరీక్షలు లేదా నిర్దేశిత ఆసుపత్రులలో నగదు రహిత చికిత్స.',
          documents: 'ఆధార్ కార్డు, బియ్యం కార్డు / రేషన్ కార్డు, డాక్టర్ ప్రిస్క్రిప్షన్.',
          steps: 'సమీప గ్రామ సచివాలయం లేదా వైఎస్సార్ విలేజ్ క్లినిక్ కి వెళ్లవచ్చు.'
        },
        voice_url: null
      };
    }

    sendEvent('progress', { stage: 'complete', pct: 100, badge: 'Complete', title: 'Stream Processing Complete!', sub: 'Rendering scheme details card...' });
    sendEvent('result', finalResponse);
    res.end();
  } catch (err) {
    console.error('Error in /simplify-stream:', err);
    sendEvent('error', { error: 'Stream error occurred. Please try uploading again.' });
    res.end();
  }
});

// Dedicated Health Scheme Document PDF Processing and Extraction API
app.post('/api/process-scheme-pdf', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Please upload a valid PDF document.' });
    }

    const ai = getGeminiClient();
    const result = await processSchemeDocumentPdf(req.file.buffer, {
      filename: req.file.originalname,
      aiClient: ai
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error in /api/process-scheme-pdf:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process scheme document PDF.',
      details: err.message
    });
  }
});

// Microsoft Edge Neural Text-to-Speech API Endpoint with natural pace & clear voice
// Telugu: te-IN-ShrutiNeural | English: en-IN-NeerjaNeural
app.all(['/api/tts', '/tts'], async (req, res) => {
  try {
    const rawText = ((req.method === 'POST' ? req.body.text : req.query.text) || '').trim();
    const lang = (req.method === 'POST' ? req.body.lang : req.query.lang) || 'te';
    const isSlow = ((req.method === 'POST' ? req.body.slow : req.query.slow) === 'true') || false;
    const requestedVoice = (req.method === 'POST' ? req.body.voice : req.query.voice) || '';

    if (!rawText) {
      return res.status(400).json({ error: 'Text parameter is required for TTS synthesis.' });
    }

    // Route language to server-side Edge-TTS audio generator
    const { buffer, voice, lang: resolvedLang } = await generate_text_audio(rawText, lang, {
      slow: isSlow,
      customVoice: requestedVoice || undefined
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-TTS-Voice', voice);
    res.setHeader('X-TTS-Lang', resolvedLang);
    res.send(buffer);
  } catch (err) {
    console.error('Edge TTS synthesis failed:', err.message);
    res.status(500).json({ error: 'TTS audio synthesis failed', details: err.message });
  }
});

// Fast in-memory cache for chat queries to ensure instant sub-second responses
const quickChatCache = new Map();

// Query Language Detection Helper: dynamically respects client UI state while prioritizing explicit prompt requests
function detectQueryLanguage(userText = '', clientLang = 'en') {
  const text = (userText || '').trim();

  // 1. Explicit language overrides in user text
  const explicitHindiReq = /\b(in hindi|hindi lo|speak hindi|tell in hindi|reply in hindi|answer in hindi|हिंदी|हिन्दी)\b/i.test(text);
  if (explicitHindiReq) return 'hi';

  const explicitTeluguReq = /\b(in telugu|telugu lo|telugulo|speak telugu|tell in telugu|reply in telugu|answer in telugu|తెలుగులో|తెలుగు)\b/i.test(text);
  if (explicitTeluguReq) return 'te';

  const explicitEnglishReq = /\b(in english|speak english|tell in english|reply in english|answer in english|english)\b/i.test(text);
  if (explicitEnglishReq) return 'en';

  // 2. Check for Telugu script characters (\u0C00-\u0C7F)
  const hasTeluguScript = /[\u0C00-\u0C7F]/.test(text);
  if (hasTeluguScript) return 'te';

  // 3. Dynamic UI state preference: honor the client UI language selection
  if (clientLang && ['te', 'hi', 'en'].includes(clientLang)) {
    return clientLang;
  }

  return 'en';
}

// System Instruction Builder for SmartGovAI Healthcare Advisor Role
function buildHealthcareAdvisorSystemInstruction(lang = 'en', matchedSchemes = [], roleType = 'advisor') {
  const isEn = lang === 'en';
  const isTe = lang === 'te';

  // Extract compact scheme summary to minimize token overhead and accelerate response latency
  const compactSchemes = (matchedSchemes || []).slice(0, 3).map(s => ({
    name: s.scheme_name,
    telugu_name: s.telugu_name,
    category: s.category,
    limit: s.financial_limit || s.limit,
    official_website: s.official_website || s.source_url || 'https://ysraarogyasri.ap.gov.in',
    eligibility: isEn ? (s.simplified?.eligibility || s.eligibility) : (s.telugu?.eligibility || s.eligibility),
    benefits: isEn ? (s.simplified?.benefits || s.benefits) : (s.telugu?.benefits || s.benefits),
    steps: isEn ? (s.simplified?.steps || s.steps) : (s.telugu?.steps || s.steps)
  }));
  const schemeJson = JSON.stringify(compactSchemes);

  if (isEn) {
    return `You are SmartGovAI, the official Virtual Healthcare & Welfare Advisor and Health Scheme Information Specialist for Andhra Pradesh (AP).

STRICT DOMAIN BOUNDARY & REFUSAL POLICY:
- You are strictly a Health Scheme Information Specialist for Andhra Pradesh and National Public Health Welfare Programs.
- If the user asks non-scheme questions or topics outside of public healthcare, government welfare, medical assistance, eligibility, or hospital services (e.g., sports, movies, coding, general trivia, weather, political banter, entertainment, non-medical topics), you MUST POLITELY REFUSE to answer.
- Refusal Response Pattern: Politely state that as SmartGovAI Healthcare Advisor, you are specialized exclusively in Andhra Pradesh and National public healthcare and welfare schemes. List 2-3 topics you CAN assist with (e.g., Dr. YSR Aarogyasri ₹25 Lakhs cashless hospital treatment, Aarogya Asara recovery allowance, or 108/104/102 helplines), and invite them to ask a scheme-related query.

OFFICIAL SOURCE CITATION REQUIREMENT:
- All responses discussing specific schemes MUST cite the specific official Andhra Pradesh government health scheme source or portal URL where available (e.g., official_website in data or default https://ysraarogyasri.ap.gov.in).
- Format citations cleanly at the end of your response, e.g.: 🔗 **Official Portal**: https://ysraarogyasri.ap.gov.in

LANGUAGE DIRECTIVE:
- The active user interface language is ENGLISH. Generate your ENTIRE response fluently in clear, natural English.
- Translate all underlying scheme details, eligibility requirements, and steps into natural English.

CONVERSATIONAL DIRECTIVE:
- If the user sends a simple greeting (e.g. "hi", "hello", "namaste", "good morning"), respond warmly as SmartGovAI AP Healthcare Advisor, introduce what you can help with (Aarogyasri ₹25 Lakhs coverage, Aarogya Asara, maternal aid, finding nearby network hospitals), and invite them to ask their question. Do NOT output details of a specific scheme when answering a casual greeting.

ROLE & FORMAT:
- Act as a fast, compassionate, authoritative counselor.
- Keep responses clear, accurate, and concise (under 160 words).
- Format: Bold headers, clean bullet points.
- Explain AP health benefits (e.g. Dr. YSR / NTR Aarogyasri up to ₹25 Lakhs cashless hospital care, Aarogya Asara allowance, maternal aid, pensions).
- Detail eligibility (White/Rice card, BPL status) and application steps (Grama Sachivalayam, PHC, Aarogya Mithra desk).
- Emergency Helplines: 108 (Ambulance), 104 (Medical Advice), 102 (Mother & Child Transport).

RELEVANT SCHEMES DATA: ${schemeJson}`;
  }

  if (isTe) {
    return `మీరు SmartGovAI అధికారిక ఆంధ్రప్రదేశ్ ఆరోగ్య పథకాల సమాచార నిపుణుడు మరియు సలహాదారు (AP Healthcare & Welfare Scheme Specialist).

విషయ పరిమితి & తిరస్కరణ నిబంధనలు (STRICT DOMAIN BOUNDARY & REFUSAL POLICY):
- మీరు కేవలం ఆంధ్రప్రదేశ్ మరియు జాతీయ ప్రభుత్వ ఆరోగ్య, సంక్షేమ పథకాల సమాచార నిపుణుడు మాత్రమే.
- వినియోగదారు ప్రభుత్వ ఆరోగ్య పథకాలు, వైద్య సహాయం, ఆసుపత్రులు, అర్హతలు కాకుండా ఇతర విషయాల గురించి (ఉదాహరణకు: సినిమాలు, క్రీడలు, సాఫ్ట్‌వేర్ కోడింగ్, వాతావరణం, రాజకీయం, వినోదం) అడిగితే, ఆ ప్రశ్నలకు జవాబు ఇవ్వడానికి వినయంగా నిరాకరించండి.
- తిరస్కరణ శైలి: "క్షమించండి, SmartGovAI సలహాదారుగా నేను కేవలం ఆంధ్రప్రదేశ్ మరియు జాతీయ ఆరోగ్య పథకాల సమాచారాన్ని మాత్రమే అందించగలను." అని చెప్పి, మీరు సహాయపడగల అంశాలను (ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత వైద్యం, ఆరోగ్య ఆసరా, 108/104 హెల్ప్‌లైన్‌లు) గుర్తుచేసి ఆరోగ్య పథకాలకు సంబంధించిన ప్రశ్నలు అడగమని కోరండి.

అధికారిక వెబ్‌సైట్ మరియు మూలాల సూచన (OFFICIAL SOURCE CITATION REQUIREMENT):
- మీరు పథకం గురించి సమాధానం ఇచ్చే ప్రతిసారీ తప్పనిసరిగా సదరు ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆరోగ్య పథకం యొక్క అధికారిక వెబ్‌సైట్ / పోర్టల్ URL ను క్రమంగా దాఖలు చేయాలి (ఉదాహరణకు: 🔗 **అధికారిక పోర్టల్**: https://ysraarogyasri.ap.gov.in లేదా డేటాలో ఉన్న official_website URL).
- ఈ వెబ్‌సైట్ లింక్‌ను సమాధానం చివర స్పష్టంగా చూపించండి.

భాషా సూచన:
- ప్రస్తుతం యాక్టివ్ UI భాష తెలుగు (Telugu). మీ మొత్తం సమాధానం స్పష్టమైన, సులభమైన తెలుగు భాషలోనే ఉండాలి.
- సమాధానం స్పష్టంగా, సంక్షిప్తంగా (150 పదాల లోపు) ఉండాలి.

సాధారణ సంభాషణల సూచన:
- వినియోగదారు "హాయ్", "నమస్కారం", "హలో" వంటి సాధారణ అభివాదాలు తెలిపితే, సలహాదారుగా స్వాగతం చెప్పి మీరు దేని గురించి సహాయపడగలరో (ఆరోగ్యశ్రీ, ఆసరా, తల్లీబిడ్డల సంరక్షణ, ఆసుపత్రుల వివరాలు) చెప్పి ప్రశ్న అడగమని కోరండి. అవసరం లేకుండా ఏ ప్రత్యేక పథకం వివరాలు ఇవ్వకండి.

ముఖ్య సమాచారం:
1. ప్రయోజనాలు (ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత చికిత్స, ఉచిత పరీక్షలు, పెన్షన్లు, గర్భిణుల సహాయం).
2. అర్హత (బియ్యం కార్డు / రేషన్ కార్డు) మరియు దరఖాస్తు విధానం (గ్రామ సచివాలయం, PHC, నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్యమిత్ర).
3. హెల్ప్‌లైన్లు: 108 (అంబులెన్స్), 104 (ఆరోగ్య సలహాలు), 102 (తల్లీబిడ్డల వాహనం).
4. ఫార్మాట్: బోల్డ్ హెడ్డింగ్స్, బుల్లెట్ పాయింట్లు.

పథకాల వివరాలు: ${schemeJson}`;
  }

  return `You are SmartGovAI, the official Virtual Healthcare & Welfare Advisor and Health Scheme Specialist for Andhra Pradesh (AP).

STRICT DOMAIN BOUNDARY:
- You are strictly an Andhra Pradesh and National Healthcare Schemes Specialist.
- If the user asks non-healthcare or non-scheme questions (e.g., entertainment, sports, coding, weather, politics), politely refuse in Hindi, stating that SmartGovAI is specialized exclusively in AP Healthcare and Welfare Schemes (like Aarogyasri ₹25 Lakhs coverage, Aarogya Asara, and 108/104 helplines).

OFFICIAL SOURCE CITATION REQUIREMENT:
- All responses discussing specific schemes MUST cite the specific official Andhra Pradesh government health scheme source or portal URL where available (e.g. 🔗 Official Portal: https://ysraarogyasri.ap.gov.in).

LANGUAGE DIRECTIVE: The user UI language is Hindi. Respond strictly in clear Hindi (Devanagari script).
Keep answers clear, concise (under 160 words) with bullet points.
RELEVANT SCHEMES DATA: ${schemeJson}`;
}

// Multi-Turn Chat Endpoint with Gemini + Fast Grounded Fallback
app.post(['/chat', '/api/chat'], async (req, res) => {
  const { question, query, message, history = [], lang = 'en', mode = 'general' } = req.body;
  const userText = (question || query || message || '').trim();

  if (!userText) {
    return res.status(400).json({ error: 'Question or message is required' });
  }

  // Language Detection: Detect query language, strictly enforcing English unless another language is requested
  const effectiveLang = detectQueryLanguage(userText, lang);
  const isEn = effectiveLang === 'en';

  // Context-aware scheme retrieval utilizing both current prompt and recent history
  const matchedSchemes = retrieveRelevantSchemes(userText, effectiveLang, 4, history);

  // Model Selection based on task complexity:
  // - 'fast': gemini-3.1-flash-lite
  // - 'complex': gemini-3.1-pro-preview
  // - 'general': gemini-3.5-flash
  let targetModel = 'gemini-3.5-flash';
  if (mode === 'fast') {
    targetModel = 'gemini-3.1-flash-lite';
  } else if (mode === 'complex') {
    targetModel = 'gemini-3.1-pro-preview';
  }

  const systemInstruction = buildHealthcareAdvisorSystemInstruction(effectiveLang, matchedSchemes, 'advisor');

  const ai = getGeminiClient();
  let aiResponseText = null;
  let modelUsed = targetModel;

  if (ai) {
    try {
      // Build structured multi-turn conversation history for Gemini API
      const contents = [];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-8).forEach(turn => {
          const role = (turn.role === 'model' || turn.role === 'assistant') ? 'model' : 'user';
          const t = (turn.text || turn.content || '').trim();
          if (t) {
            contents.push({
              role: role,
              parts: [{ text: t }]
            });
          }
        });
      }

      // Ensure last turn is current user message
      if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: userText }]
        });
      } else {
        contents[contents.length - 1].parts[0].text = userText;
      }

      const geminiPromise = ai.models.generateContent({
        model: targetModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 800,
        }
      });

      // 7-second timeout for fast responsive UI
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 7000)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      aiResponseText = (result.text || '').trim();
    } catch (err) {
      console.warn(`Gemini chat notice (${targetModel} - ${err.message}): fallback to gemini-3.5-flash / grounded AP scheme analyzer`);
      // Fallback attempt with gemini-3.5-flash if primary model fails
      if (targetModel !== 'gemini-3.5-flash') {
        try {
          modelUsed = 'gemini-3.5-flash';
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: userText }] }],
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.2,
              maxOutputTokens: 600,
            }
          });
          aiResponseText = (fallbackRes.text || '').trim();
        } catch (e) {
          console.warn('Gemini 3.5 flash fallback error:', e.message);
        }
      }
    }
  }

  if (aiResponseText) {
    logRequest(matchedSchemes[0]?.scheme_name || 'Multi-turn AI Chat', 'chat');
    return res.json({
      response: aiResponseText,
      answer: aiResponseText,
      matched_schemes: matchedSchemes,
      model_used: modelUsed,
      mode,
    });
  }

  const qClean = userText.toLowerCase().replace(/[.,?!'\"(){}\[\]:;-]/g, '').trim();
  const isGreeting = /^(hi+|hello+|hey+|namaste+|namaskaram+|namaskar+|good\s*(morning|afternoon|evening)|hi\s+there|howdy|greetings|who\s+are\s+you|what\s+can\s+you\s+do|నమస్కారం|నమస్తే|హలో|హాయ్)$/i.test(qClean);
  const isGratitude = /^(thanks+|thank\s*you+|thx+|dhanyavadalu+|ధన్యవాదాలు|థ్యాంక్స్)$/i.test(qClean);
  const isFarewell = /^(bye+|goodbye+|cya+|see\s*you+|వెళ్తాను|బై)$/i.test(qClean);

  if (isGreeting) {
    const greetingMsg = isEn
      ? `Hello! 👋 Welcome to **SmartGovAI**, your official virtual advisor for Andhra Pradesh Healthcare & Welfare Schemes.\n\nI can assist you with:\n• **Dr. YSR / NTR Aarogyasri**: Free cashless hospital treatment up to ₹25 Lakhs per family.\n• **YSR Aarogya Asara**: Daily post-operative wage replacement allowance during recovery.\n• **Maternal & Child Health**: Financial aid, nutrition, and 102 free transport.\n• **Network Hospitals**: Locating nearby empanelled government and private hospitals.\n\nHow can I help you today? Feel free to ask about any medical procedure, eligibility, or required documents!`
      : `నమస్కారం! 🙏 **SmartGovAI** ఆంధ్రప్రదేశ్ ఆరోగ్య మరియు సంక్షేమ పథకాల వర్చువల్ సలహాదారుకి స్వాగతం.\n\nనేను మీకు వీటి గురించి స్పష్టమైన సమాచారం అందించగలను:\n• **డాక్టర్ వైఎస్‌ఆర్ ఆరోగ్యశ్రీ**: కుటుంబానికి ₹25 లక్షల వరకు ఉచిత ఆసుపత్రి చికిత్స.\n• **ఆరోగ్య ఆసరా**: ఆసుపత్రి నుంచి కోలుకునే సమయంలో రోజువారీ ఆర్థిక సహాయం.\n• **తల్లీబిడ్డల సంరక్షణ**: గర్భిణులు, శిశువుల ఆరోగ్య పథకాలు మరియు 102 ఉచిత రవాణా.\n• **నెట్‌వర్క్ ఆసుపత్రులు**: మీ సమీపంలోని ఆరోగ్యశ్రీ ఆసుపత్రుల వివరాలు.\n\nఈరోజు మీకు ఎలా సహాయపడగలను? ఏదైనా వైద్య సమస్య, అర్హత లేదా కావలసిన పత్రాల గురించి అడగండి!`;

    return res.json({
      response: greetingMsg,
      answer: greetingMsg,
      matched_schemes: [],
      model_used: 'smartgov-greeting-handler',
      mode,
    });
  }

  if (isGratitude) {
    const gratitudeMsg = isEn
      ? `You're very welcome! 😊 I'm glad I could help.\n\nStay healthy! Feel free to ask whenever you have questions about AP government health schemes, hospital admissions, or helplines (108 / 104 / 102).`
      : `మీకు కూడా నా ధన్యవాదాలు! 😊 మీకు సహాయపడటం నా బాధ్యత.\n\nఆరోగ్యంగా ఉండండి! ఆంధ్రప్రదేశ్ ప్రభుత్వ ఉచిత వైద్య పథకాలు లేదా హెల్ప్‌లైన్లు (108 / 104 / 102) గురించి ఏ సందేహం ఉన్నా నన్ను అడగవచ్చు.`;

    return res.json({
      response: gratitudeMsg,
      answer: gratitudeMsg,
      matched_schemes: [],
      model_used: 'smartgov-gratitude-handler',
      mode,
    });
  }

  if (isFarewell) {
    const farewellMsg = isEn
      ? `Goodbye! 👋 Stay healthy and safe. Remember you can consult SmartGovAI anytime for AP health scheme guidance!\n\nEmergency Helpline: 108 | Health Advice: 104`
      : `శుభం! 👋 మీ ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి. ప్రభుత్వ ఉచిత వైద్య పథకాల వివరాల కోసం ఎప్పుడైనా SmartGovAI ని సంప్రదించవచ్చు!\n\nఅత్యవసర అంబులెన్స్: 108 | ఆరోగ్య సలహాలు: 104`;

    return res.json({
      response: farewellMsg,
      answer: farewellMsg,
      matched_schemes: [],
      model_used: 'smartgov-farewell-handler',
      mode,
    });
  }

  // Dynamic Contextual Fallback (answers question specifically based on topic asked)
  if (matchedSchemes.length > 0) {
    const top = matchedSchemes[0];
    const qLower = userText.toLowerCase();
    let fallbackText = '';

    const isDocQuery = qLower.includes('document') || qLower.includes('doc') || qLower.includes('proof') || qLower.includes('పత్రాలు') || qLower.includes('కాగితాలు') || qLower.includes('ఆధార్');
    const isEligQuery = qLower.includes('eligib') || qLower.includes('who') || qLower.includes('qualif') || qLower.includes('అర్హత') || qLower.includes('ఎవరు') || qLower.includes('పరిమితి');
    const isApplyQuery = qLower.includes('how') || qLower.includes('apply') || qLower.includes('where') || qLower.includes('process') || qLower.includes('ఎలా') || qLower.includes('దరఖాస్తు') || qLower.includes('ఎక్కడ');
    const isBenefitQuery = qLower.includes('benefit') || qLower.includes('money') || qLower.includes('amount') || qLower.includes('free') || qLower.includes('lakh') || qLower.includes('రూపాయలు') || qLower.includes('లాభం') || qLower.includes('సహాయం');

    if (isEn) {
      let specificSection = '';
      if (isDocQuery) {
        specificSection = `📄 **Required Documents for ${top.scheme_name}**:\n${top.documents || '• Aadhaar Card\n• White Ration Card / Rice Card\n• Doctor Referral & Medical Diagnostic Reports'}\n\n📍 Submit at your nearest Grama Sachivalayam, PHC, or Aarogya Mithra Desk.`;
      } else if (isEligQuery) {
        specificSection = `✅ **Eligibility Criteria for ${top.scheme_name}**:\n${top.eligibility}\n\n• Target Beneficiaries: ${top.category}\n• Key Requirement: AP Resident with White Ration / Rice Card or Income Certificate.`;
      } else if (isApplyQuery) {
        specificSection = `📝 **How to Apply for ${top.scheme_name}**:\n${top.steps || '1. Visit your local Village/Ward Secretariat (Grama Sachivalayam) or Primary Health Centre (PHC).\n2. Consult the ANM, ASHA worker, or Sachivalayam Health Assistant.\n3. For hospital admissions, directly meet the Aarogya Mithra desk at any empanelled network hospital.'}`;
      } else if (isBenefitQuery) {
        specificSection = `💰 **Benefits & Coverage of ${top.scheme_name}**:\n${top.benefits}\n\n• Category: ${top.category}\n• Official Helpline: 104 (Health Information) / 108 (Emergency).`;
      } else {
        specificSection = `🏥 **${top.scheme_name}** (${top.category}):\n• **Benefits**: ${top.benefits}\n• **Eligibility**: ${top.eligibility}\n• **Required Documents**: ${top.documents || 'Aadhaar Card, Rice Card, Medical Reports'}\n• **How to Apply**: ${top.steps || 'Visit nearest PHC, Village Clinic, or Sachivalayam.'}`;
      }

      fallbackText = `Based on verified AP Government records for **${top.scheme_name}**:\n\n${specificSection}\n\n*Helplines: 108 (Ambulance) | 104 (Medical Advice) | 102 (Mother & Child Transport)*`;
    } else {
      let specificSection = '';
      if (isDocQuery) {
        specificSection = `📄 **${top.telugu_name} కొరకు కావలసిన పత్రాలు**:\n${top.documents || '• ఆధార్ కార్డు\n• బియ్యం కార్డు / రేషన్ కార్డు\n• డాక్టర్ ప్రిస్క్రిప్షన్ & పరీక్షల నివేదికలు'}\n\n📍 మీ సమీప గ్రామ/వార్డు సచివాలయం లేదా నెట్‌వర్క్ ఆసుపత్రి ఆరోగ్య మిత్ర వద్ద సమర్పించండి.`;
      } else if (isEligQuery) {
        specificSection = `✅ **${top.telugu_name} అర్హత నిబంధనలు**:\n${top.eligibility}\n\n• వర్గం: ${top.category}\n• ముఖ్య నిబంధన: ఆంధ్రప్రదేశ్ నివాసి అయి ఉండాలి (బియ్యం కార్డు లేదా ఆదాయ ధ్రువీకరణ).`;
      } else if (isApplyQuery) {
        specificSection = `📝 **${top.telugu_name} దరఖాస్తు విధానం**:\n${top.steps || '1. మీ గ్రామ/వార్డు సచివాలయం లేదా విలేజ్ క్లినిక్/PHC ని సందర్శించండి.\n2. ANM లేదా ఆరోగ్య సహాయకుడిని కలవండి.\n3. ఆసుపత్రిలో చేరడానికి నేరుగా ఆరోగ్య మిత్ర హెల్ప్‌డెస్క్‌ను సంప్రదించండి.'}`;
      } else if (isBenefitQuery) {
        specificSection = `💰 **${top.telugu_name} ప్రయోజనాలు & వివరాలు**:\n${top.benefits}\n\n• వర్గం: ${top.category}\n• సహాయ హెల్ప్‌లైన్: 104 (వైద్య సలహాలు) / 108 (అత్యవసరం).`;
      } else {
        specificSection = `🏥 **${top.telugu_name} (${top.scheme_name})**:\n• **ప్రయోజనాలు**: ${top.benefits}\n• **అర్హత**: ${top.eligibility}\n• **కావలసిన పత్రాలు**: ${top.documents || 'ఆధార్ కార్డు, బియ్యం కార్డు, డాక్టర్ నివేదికలు'}\n• **దరఖాస్తు విధానం**: ${top.steps || 'సమీప విలేజ్ క్లినిక్, PHC లేదా సచివాలయాన్ని సంప్రదించండి.'}`;
      }

      fallbackText = `ఆంధ్రప్రదేశ్ ప్రభుత్వ అధికారిక రికార్డుల ప్రకారం **${top.telugu_name}** సమాచారం:\n\n${specificSection}\n\n*హెల్ప్‌లైన్లు: 108 (అంబులెన్స్) | 104 (ఆరోగ్య సలహాలు) | 102 (తల్లీబిడ్డల వాహనం)*`;
    }

    logRequest(top.scheme_name, 'chat_offline_fallback');
    return res.json({
      response: fallbackText,
      answer: fallbackText,
      matched_schemes: matchedSchemes,
      model_used: 'grounded-catalog-engine',
      mode,
      offline_fallback: true,
    });
  }

  const defaultMsg = isEn
    ? 'SmartGovAI provides comprehensive guidance on Andhra Pradesh health welfare schemes including Dr. NTR Vaidya Seva (Aarogyasri), Aarogya Asara, Free Medicines, Mother & Child Care, and Dialysis support. Please ask about any health condition, hospital procedure, or eligibility criteria.'
    : 'SmartGovAI ప్రస్తుతం ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆరోగ్య పథకాలైన డాక్టర్ ఎన్టీఆర్ వైద్య సేవ (ఆరోగ్యశ్రీ), ఆరోగ్య ఆసరా, గర్భిణుల సంరక్షణ, ఉచిత మందులు మరియు డయాలసిస్ పథకాలపై సమాచారాన్ని అందిస్తుంది. దయచేసి ఏదైనా ఆరోగ్య సమస్య, ఆసుపత్రి చికిత్స లేదా అర్హత గురించి అడగండి.';

  return res.json({
    response: defaultMsg,
    answer: defaultMsg,
    matched_schemes: [],
    model_used: 'default-guide',
    mode,
  });
});

// Feedback Endpoint
app.post('/feedback', async (req, res) => {
  const { request_id, rating, comment = '' } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  const id = await saveFeedback(request_id, rating, comment);
  res.json({ status: 'success', feedback_id: id });
});

// Enhanced Community Feedback
app.post('/enhanced-feedback', async (req, res) => {
  const { scheme_name, rating, feedback_text = '', village = '', issue_type = 'general' } = req.body;
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    rating: Number(rating) || 5,
    timestamp: new Date().toISOString(),
  };
  db.staffFeedback.push(docData);
  if (dbAdmin) {
    await setDoc(doc(dbAdmin, 'staffFeedback', id), docData).catch(()=> {});
  }
  res.json({ status: 'success', id });
});

// Staff Issue Report
app.post('/staff-report', async (req, res) => {
  const { scheme_name, village = '', feedback_text = '', issue_type = 'grievance' } = req.body;
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    timestamp: new Date().toISOString(),
  };
  db.staffFeedback.push(docData);
  if (dbAdmin) {
    await setDoc(doc(dbAdmin, 'staffFeedback', id), docData).catch(()=> {});
  }
  res.json({ status: 'success', id });
});

// WhatsApp Share Logging
app.post('/whatsapp-share', async (req, res) => {
  const { scheme_name } = req.body;
  if (scheme_name) {
    const docData = {
      scheme_name,
      timestamp: new Date().toISOString(),
    };
    db.whatsappShares.push(docData);
    if (dbAdmin) {
      await addDoc(collection(dbAdmin, 'whatsappShares'), docData).catch(()=> {});
    }
  }
  res.json({ status: 'success' });
});

// AP Health Facilities API
app.get('/api/facilities', async (req, res) => {
  const { lat, lng, type, district, limit = 2000, locale = 'en' } = req.query;
  
  const cacheKey = `facilities:${lat || ''}:${lng || ''}:${type || ''}:${district || ''}:${limit}:${locale}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let results = [...facilitiesData];

  if (type && type !== 'all' && type !== 'none') {
    results = results.filter((f) => {
      const fType = (f.type || f.facility_type || '').toUpperCase();
      return fType === type.toUpperCase() || fType.includes(type.toUpperCase());
    });
  }

  if (district) {
    results = results.filter((f) => (f.district || '').toLowerCase().includes(district.toLowerCase()));
  }

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      results = results.map((f) => {
        const fLat = Number(f.lat !== undefined ? f.lat : f.latitude);
        const fLng = Number(f.lng !== undefined ? f.lng : f.longitude);
        if (!isNaN(fLat) && !isNaN(fLng)) {
          const d = calculateDistance(userLat, userLng, fLat, fLng);
          return { ...f, distance_km: Number(d.toFixed(2)) };
        }
        return f;
      });
      results.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
    }
  }

  const localizedResults = results.slice(0, parseInt(limit, 10)).map((f) => {
    let cleanType = f.type || f.facility_type || 'Hospital';
    if (cleanType.toLowerCase().includes('hospital') || cleanType === 'ఆసుపత్రి') {
      cleanType = 'Hospital';
    } else if (cleanType === 'PHC') {
      cleanType = 'Primary Health Centre (PHC)';
    } else if (cleanType === 'CHC') {
      cleanType = 'Community Health Centre (CHC)';
    }
    return {
      ...f,
      locale: locale || 'en',
      type: cleanType,
      facility_type: cleanType,
    };
  });

  await setCache(cacheKey, localizedResults, 3600);
  res.json(localizedResults);
});

// Local Help Locations
app.get('/local-locations', (req, res) => {
  res.json({
    status: 'success',
    locations: [
      { name: 'Dr. NTR University of Health Sciences Hospital', type: 'Teaching Hospital', district: 'Vijayawada' },
      { name: 'King George Hospital (KGH)', type: 'Government General Hospital', district: 'Visakhapatnam' },
      { name: 'Guntur Medical College & Hospital', type: 'Government General Hospital', district: 'Guntur' },
      { name: 'Sri Venkateswara Institute of Medical Sciences (SVIMS)', type: 'Super Specialty Hospital', district: 'Tirupati' },
    ],
  });
});

// Document Checklist
app.get('/document-checklist', (req, res) => {
  const { scheme_name } = req.query;
  const scheme = schemes[scheme_name];
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  res.json({
    scheme_name,
    required_documents: scheme.required_documents || [],
  });
});

// Eligibility Check API
app.post('/eligibility-check', (req, res) => {
  const { scheme_name, answers } = req.body;
  const match = findScheme(scheme_name);
  if (!match) {
    return res.status(404).json({ error: 'Scheme not found' });
  }

  const scheme = match.data;
  const questions = scheme.eligibility_questions || [];
  let isEligible = true;
  if (answers && typeof answers === 'object') {
    for (const [idx, ans] of Object.entries(answers)) {
      if (ans === 'no') {
        isEligible = false;
      }
    }
  }

  res.json({
    scheme_name,
    is_eligible: isEligible,
    guidance: isEligible
      ? 'మీరు ప్రాథమిక అర్హతలను కలిగి ఉన్నట్లు కనిపిస్తోంది. తుది నిర్ధారణ కోసం గ్రామ సచివాలయంలో సంప్రదించండి.'
      : 'కొన్ని నిబంధనలు సరిపోలకపోవచ్చు. సడలింపుల కోసం సంబంధిత ఆరోగ్య కేంద్రాన్ని సంప్రదించండి.',
  });
});

// Offline Cache Metadata
app.get('/offline-cache', (req, res) => {
  res.json({
    cached_at: new Date().toISOString(),
    schemes_count: schemeNames.length,
    schemes_list: schemes,
  });
});

// Offline page
app.get('/offline.html', (req, res) => {
  res.render('offline');
});

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN || '12345678';
  if (req.session && req.session.admin_authenticated) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === adminToken) {
      return next();
    }
  }

  const headerToken = req.headers['x-admin-token'];
  if (headerToken && headerToken === adminToken) {
    return next();
  }

  const queryToken = req.query.admin_token || req.query.token;
  if (queryToken && queryToken === adminToken) {
    return next();
  }

  if (req.accepts(['html', 'json']) === 'html') {
    return res.redirect(`/admin/login?next=${encodeURIComponent(req.originalUrl)}`);
  }

  return res.status(401).json({ error: 'Admin authentication required.' });
}

// Admin Login
app.get('/admin/login', (req, res) => {
  const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
  req.session.csrf_token = csrfToken;
  res.render('admin_login', {
    csrf_token: csrfToken,
    messages: req.session.messages || [],
    nextUrl: req.query.next || '/analytics',
  });
  req.session.messages = [];
});

app.post('/admin/login', (req, res) => {
  const { token } = req.body;
  const adminToken = process.env.ADMIN_TOKEN || '12345678';

  if (token && token.trim() === adminToken) {
    req.session.admin_authenticated = true;
    const nextUrl = req.query.next || '/analytics';
    return res.redirect(nextUrl);
  }

  req.session.messages = [{ category: 'error', text: 'చెల్లని అడ్మిన్ టోకెన్ (Invalid admin token).' }];
  res.redirect('/admin/login');
});

app.get('/admin/logout', (req, res) => {
  req.session.admin_authenticated = false;
  res.redirect('/');
});

// Analytics Dashboard (Admin protected)
app.get('/analytics', requireAdmin, async (req, res) => {
  const metrics = await getDashboardMetrics();
  const stats = await getSchemeStats();
  
  let recentFeedback = (db.feedback || []).slice(-20).reverse();
  let grievances = (db.staffFeedback || []).slice(-20).reverse();

  if (dbAdmin) {
    try {
      const fbSnap = await getDocs(query(collection(dbAdmin, 'feedback'), orderBy('timestamp', 'desc'), fsLimit(20)));
      recentFeedback = [];
      fbSnap.forEach(d => recentFeedback.push(d.data()));

      const staffSnap = await getDocs(query(collection(dbAdmin, 'staffFeedback'), orderBy('timestamp', 'desc'), fsLimit(20)));
      grievances = [];
      staffSnap.forEach(d => grievances.push(d.data()));
    } catch (e) { console.error('Firebase analytics fetch error:', e); }
  }

  const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
  req.session.csrf_token = csrfToken;
  res.render('analytics', { metrics, stats, recentFeedback, grievances, csrf_token: csrfToken });
});

// ==================== Firestore Direct Scheme CRUD API ====================

// GET all schemes from Firestore
app.get('/api/admin/firestore/schemes', requireAdmin, async (req, res) => {
  try {
    const list = [];
    if (dbAdmin) {
      const snap = await getDocs(collection(dbAdmin, 'schemes'));
      snap.forEach((d) => {
        const data = d.data();
        data._firestore_id = d.id;
        list.push(data);
      });
    }

    // Fallback/Merge with in-memory catalog if Firestore list is empty or partial
    if (list.length === 0) {
      Object.keys(schemes).forEach((sName) => {
        const item = schemes[sName];
        const id = item.id || item.slug || generateSlug(sName);
        list.push({
          _firestore_id: id,
          id: id,
          scheme_name: sName,
          telugu_name: item.telugu_name || (typeof item.telugu === 'object' ? item.telugu.scheme_name : sName) || sName,
          category: item.category || 'General Healthcare',
          level: item.level || 'State Government',
          benefit_amount: item.benefit_amount || '',
          benefit_amount_te: item.benefit_amount_te || '',
          source_name: item.source_name || 'Official Portal',
          source_url: item.source_url || item.official_website || '',
          official_website: item.official_website || item.source_url || '',
          simplified: typeof item.simplified === 'string' ? item.simplified : JSON.stringify(item.simplified || ''),
          telugu: typeof item.telugu === 'string' ? item.telugu : (item.telugu?.details || item.telugu?.simplified || JSON.stringify(item.telugu || '')),
          eligibility_confirmation: item.eligibility_confirmation || 'Government Office / Empanelled Hospital',
          updated_at: item.updated_at || new Date().toISOString()
        });
      });
    }

    res.json({ success: true, count: list.length, schemes: list });
  } catch (err) {
    console.error('Error fetching schemes from Firestore:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save / Update Scheme in Firestore
app.post('/api/admin/firestore/schemes', requireAdmin, express.json(), express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const body = req.body || {};
    const scheme_name = (body.scheme_name || '').trim();
    if (!scheme_name) {
      return res.status(400).json({ success: false, error: 'Scheme name is required.' });
    }

    const docId = (body.id || body._firestore_id || generateSlug(scheme_name)).trim();
    const docData = {
      id: docId,
      scheme_name: scheme_name,
      telugu_name: (body.telugu_name || '').trim() || scheme_name,
      category: (body.category || 'General Healthcare').trim(),
      level: (body.level || 'State Government').trim(),
      benefit_amount: (body.benefit_amount || '').trim(),
      benefit_amount_te: (body.benefit_amount_te || '').trim(),
      source_name: (body.source_name || 'Official Govt Portal').trim(),
      source_url: (body.source_url || body.official_website || '').trim(),
      official_website: (body.official_website || body.source_url || '').trim(),
      simplified: (body.simplified || '').trim(),
      telugu: (body.telugu || '').trim(),
      eligibility_confirmation: (body.eligibility_confirmation || 'Government Office / Empanelled Hospital').trim(),
      updated_at: new Date().toISOString()
    };

    if (dbAdmin) {
      await setDoc(doc(dbAdmin, 'schemes', docId), docData, { merge: true });
    }

    // Sync in-memory catalog
    schemes[scheme_name] = {
      ...docData,
      slug: docId,
      voice_url: '/public/audio/' + docId + '.mp3'
    };
    slugToScheme[docId] = scheme_name;
    if (!schemeNames.includes(scheme_name)) {
      schemeNames.push(scheme_name);
      schemeNames.sort();
    }
    invalidateSchemesCache();

    // Persist custom copy to file system
    const customFilePath = path.join(DATA_DIR, 'custom_schemes.json');
    let customSchemes = {};
    if (fs.existsSync(customFilePath)) {
      try { customSchemes = JSON.parse(fs.readFileSync(customFilePath, 'utf8')); } catch(e) {}
    }
    customSchemes[scheme_name] = schemes[scheme_name];
    fs.writeFileSync(customFilePath, JSON.stringify(customSchemes, null, 2), 'utf8');

    res.json({
      success: true,
      message: `Scheme "${scheme_name}" successfully saved to Firestore collection!`,
      id: docId,
      scheme: docData
    });
  } catch (err) {
    console.error('Error saving scheme to Firestore:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Scheme from Firestore
app.delete('/api/admin/firestore/schemes/:id', requireAdmin, async (req, res) => {
  try {
    const docId = req.params.id;
    if (!docId) {
      return res.status(400).json({ success: false, error: 'Document ID is required.' });
    }

    if (dbAdmin) {
      await deleteDoc(doc(dbAdmin, 'schemes', docId));
    }

    // Remove from in-memory catalog
    let foundSchemeName = slugToScheme[docId];
    if (!foundSchemeName) {
      Object.keys(schemes).forEach((sName) => {
        if (schemes[sName].id === docId || schemes[sName].slug === docId || generateSlug(sName) === docId) {
          foundSchemeName = sName;
        }
      });
    }

    if (foundSchemeName) {
      delete schemes[foundSchemeName];
      delete slugToScheme[docId];
      schemeNames = schemeNames.filter((n) => n !== foundSchemeName);
      invalidateSchemesCache();
    }

    res.json({
      success: true,
      message: `Scheme "${docId}" deleted successfully from Firestore collection.`,
      id: docId
    });
  } catch (err) {
    console.error('Error deleting scheme from Firestore:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SEED/Batch upload local catalog to Firestore collection
app.post('/api/admin/firestore/schemes/seed', requireAdmin, async (req, res) => {
  try {
    if (!dbAdmin) {
      return res.status(500).json({ success: false, error: 'Firestore database is not connected.' });
    }

    let batchCount = 0;
    const allNames = Object.keys(schemes);
    for (const sName of allNames) {
      const item = schemes[sName];
      const docId = item.id || item.slug || generateSlug(sName);
      const docData = {
        id: docId,
        scheme_name: sName,
        telugu_name: item.telugu_name || (typeof item.telugu === 'object' ? item.telugu.scheme_name : sName) || sName,
        category: item.category || 'General Healthcare',
        level: item.level || 'State Government',
        benefit_amount: item.benefit_amount || '',
        benefit_amount_te: item.benefit_amount_te || '',
        source_name: item.source_name || 'Official Govt Portal',
        source_url: item.source_url || item.official_website || '',
        official_website: item.official_website || item.source_url || '',
        simplified: typeof item.simplified === 'string' ? item.simplified : JSON.stringify(item.simplified || ''),
        telugu: typeof item.telugu === 'string' ? item.telugu : (item.telugu?.details || item.telugu?.simplified || JSON.stringify(item.telugu || '')),
        eligibility_confirmation: item.eligibility_confirmation || 'Government Office / Empanelled Hospital',
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(dbAdmin, 'schemes', docId), docData, { merge: true });
      batchCount++;
    }

    res.json({
      success: true,
      message: `Successfully batch-seeded ${batchCount} schemes to Firestore collection!`,
      count: batchCount
    });
  } catch (err) {
    console.error('Error seeding schemes to Firestore:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/admin/schemes', requireAdmin, express.urlencoded({ extended: true }), (req, res) => {
  if (req.body.csrf_token !== req.session.csrf_token) {
    return res.status(403).send('CSRF Validation Failed');
  }
  const { scheme_name, category, simplified, telugu } = req.body;
  if (!scheme_name || !category || !simplified || !telugu) {
    return res.status(400).send('All fields are required.');
  }

  // Add/Update scheme in memory
  schemes[scheme_name] = {
    category,
    simplified,
    telugu,
    slug: generateSlug(scheme_name),
  };
  slugToScheme[schemes[scheme_name].slug] = scheme_name;

  // Persist to custom JSON
  const customFilePath = path.join(DATA_DIR, 'custom_schemes.json');
  let customSchemes = {};
  if (fs.existsSync(customFilePath)) {
    try {
      customSchemes = JSON.parse(fs.readFileSync(customFilePath, 'utf8'));
    } catch(e) {}
  }
  customSchemes[scheme_name] = schemes[scheme_name];
  fs.writeFileSync(customFilePath, JSON.stringify(customSchemes, null, 2), 'utf8');

  res.redirect('/analytics?msg=Scheme+Saved');
});

// ==================== 15-Day Automated Scraper Scheduler ====================
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

async function runScraperSyncSafely() {
  try {
    console.log('🔄 Executing scheduled India.gov.in scheme scraper & Firestore sync...');
    const result = await scrapeAndSyncIndiaGovSchemes();
    loadSchemesData();
    console.log(`✅ Automated scraper completed successfully! Total loaded schemes: ${schemeNames.length}`);
    return result;
  } catch (err) {
    console.error('⚠️ Background scraper sync warning:', err.message);
  }
}

function setupAutomatedScraperInterval() {
  console.log('⏰ Scheduled 15-day automated scheme scraper job (Interval: 15 days).');
  
  // Recurring 15-day interval
  setInterval(() => {
    runScraperSyncSafely();
  }, FIFTEEN_DAYS_MS);
}

// Endpoint to trigger India.gov.in / MyScheme.gov.in scheme scraper and sync catalog
app.post('/api/admin/sync-india-gov-schemes', async (req, res) => {
  try {
    console.log('🔄 Triggering India.gov.in scheme scraper and synchronization...');
    const result = await runScraperSyncSafely();
    res.json({
      success: true,
      message: 'National scheme data scraped and synchronized successfully from India.gov.in & MyScheme.gov.in',
      source: result?.source || 'india.gov.in',
      total_schemes_loaded: schemeNames.length,
      scraped_count: result?.count || result?.total_schemes || 0
    });
  } catch (err) {
    console.error('Failed to sync India.gov.in schemes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process safety handlers to prevent server crashes from unhandled async promises or transient socket aborts
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Server Safety] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 [Server Safety] Uncaught Exception:', err.message, err.stack);
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`SmartGov Health running at http://${HOST}:${PORT}`);
  setupAutomatedScraperInterval();
});

// Global JSON Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'అనుకోని లోపం (Unexpected error)',
    error_code: err.code || 'UNKNOWN_ERROR'
  });
});
