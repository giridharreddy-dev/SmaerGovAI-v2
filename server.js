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
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, getCountFromServer, query, orderBy, limit as fsLimit } from 'firebase/firestore';

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

loadSchemesData();
loadFacilitiesData();

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
]);

function retrieveRelevantSchemes(question, lang = 'te', maxResults = 4, history = []) {
  const currentQuery = (question || '').trim();
  const qLower = currentQuery.toLowerCase().replace(/[.,?!'\"(){}\[\]:;-]/g, '');
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
    const allText = `${nameLower} ${teluguName} ${category} ${keywords.join(' ')}`;

    // High-weight direct match with current question
    for (const kw of keywords) {
      if (qLower.includes(kw)) score += 6;
    }

    for (const ea of expandedAliases) {
      if (nameLower.includes(ea) || teluguName.includes(ea) || keywords.includes(ea)) {
        score += 6;
      }
    }

    for (const token of tokens) {
      if (token.length <= 1) continue;
      if (teluguName.includes(token)) score += 5;
      if (nameLower.includes(token)) score += 4;
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
  const schemeName = slugToScheme[slug];
  if (!schemeName) {
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
    auto_open_scheme: schemeName,
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

app.get('/api/schemes', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  
  // If batch pagination is requested via query params
  if (req.query.batch || req.query.page || req.query.offset || req.query.limit) {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = req.query.offset ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : ((Math.max(parseInt(req.query.page, 10) || 1, 1) - 1) * limit);
    const category = (req.query.category || '').toLowerCase().trim();
    const level = (req.query.level || '').trim();
    const search = (req.query.search || req.query.q || '').toLowerCase().trim();

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

    return res.json({
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
    });
  }

  res.json(schemes);
});

// Dedicated fast summary endpoint for instantaneous dashboard loading
app.get('/api/schemes/summary', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const summary = computeSchemesSummary();
  res.json({
    success: true,
    ...summary
  });
});

// Dedicated batch chunk endpoint for progressive hydration
app.get('/api/schemes/batch', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = req.query.offset !== undefined ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : ((page - 1) * limit);
  const category = (req.query.category || '').toLowerCase().trim();
  const level = (req.query.level || '').trim();
  const search = (req.query.search || req.query.q || '').toLowerCase().trim();

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

  res.json({
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
  });
});

app.post('/api/schemes/refresh', async (req, res) => {
  loadSchemesData();
  await syncSchemesFromFirestore();
  invalidateSchemesCache();
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

      // If PDF, extract embedded text using pdf-parse v2 (PDFParse class or default function)
      if (!isImage) {
        try {
          const pdfModule = await import('pdf-parse');
          if (typeof pdfModule.default === 'function') {
            const pdfData = await pdfModule.default(req.file.buffer);
            extractedText = (pdfData.text || '').trim();
          } else if (pdfModule.PDFParse) {
            const parser = new pdfModule.PDFParse({ data: req.file.buffer });
            await parser.load();
            const textResult = await parser.getText();
            extractedText = (typeof textResult === 'string' ? textResult : (textResult?.text || '')).trim();
          }
        } catch (pdfErr) {
          console.warn('pdf-parse extraction warning:', pdfErr.message);
        }
        // If extracted text has content, it is a text-based digital document
        if (extractedText && extractedText.length >= 20) {
          isImagedDoc = false;
        } else {
          isImagedDoc = true;
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
            message: textVal.reasonTe
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
              temperature: 0.2,
              maxOutputTokens: 1200,
            },
          });

          // Fast 9-second timeout to avoid long hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 9000)
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
                message: parsed.rejection_reason_te || 'అప్‌లోడ్ చేసిన పత్రం ప్రభుత్వ ఆరోగ్య లేదా సంక్షేమ పథకానికి సంబంధించినది కాదు.'
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
          message: finalVal.reasonTe
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

    const schemeData = schemes[schemeName];
    if (!schemeData) {
      return res.status(404).json({ error: 'పథకం కనుగొనబడలేదు.' });
    }

    const reqId = logRequest(schemeName, 'catalog');

    // Check for cached audio or format static path
    let voiceUrl = schemeData.voice_url || null;
    if (!voiceUrl && schemeData.audio_file) {
      const cleanAudio = schemeData.audio_file.replace(/^(\/?static\/)?/i, '').replace(/^\/+/, '');
      voiceUrl = `/public/${cleanAudio}`;
    }

    return res.json({
      request_id: reqId,
      scheme_name: schemeName,
      level: schemeData.level || 'Andhra Pradesh',
      category: schemeData.category || 'Health',
      source_name: schemeData.source_name || 'Government of Andhra Pradesh',
      source_url: schemeData.official_website || schemeData.source_url || '',
      is_ai_generated: false,
      simplified: schemeData.simplified || {},
      telugu: schemeData.telugu || {},
      voice_url: voiceUrl,
    });
  } catch (err) {
    console.error('Error in /simplify:', err);
    res.status(500).json({ error: 'సర్వర్ లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.' });
  }
});

// Helper to clean text for native Telugu voice synthesis without robotic English pronunciations
function sanitizeTeluguSpeechText(rawText) {
  if (!rawText) return '';
  let cleaned = rawText
    // Remove English bracketed clarifications e.g. (AP Cashless Hospital Care)
    .replace(/\s*\([a-zA-Z0-9\s,\-\/\.\&]+\)/g, '')
    // Common scheme transliterations for natural spoken Telugu
    .replace(/Dr\.\s*NTR\s*Vaidya\s*Seva/gi, 'డాక్టర్ ఎన్టీఆర్ వైద్య సేవ')
    .replace(/Dr\.\s*YSR\s*Aarogyasri/gi, 'డాక్టర్ వైఎస్సార్ ఆరోగ్యశ్రీ')
    .replace(/Aarogyasri|Arogyasri/gi, 'ఆరోగ్యశ్రీ')
    .replace(/Arogya\s*Asara|Aarogya\s*Aasara/gi, 'ఆరోగ్య ఆసరా')
    .replace(/Ayushman\s*Bharat/gi, 'ఆయుష్మాన్ భారత్')
    .replace(/PM-JAY|PMJAY/gi, 'పీఎంజేఏవై')
    .replace(/National\s*Health\s*Mission|NHM/gi, 'జాతీయ ఆరోగ్య మిషన్')
    .replace(/Janani\s*Suraksha\s*Yojana|JSY/gi, 'జనని సురక్ష యోజన')
    .replace(/Pradhan\s*Mantri\s*Matru\s*Vandana\s*Yojana|PMMVY/gi, 'ప్రధాన మంత్రి మాతృ వందన యోజన')
    .replace(/Mukhyamantri\s*Balasuraksha/gi, 'ముఖ్యమంత్రి బాల సురక్ష')
    .replace(/YSR\s*Kanti\s*Velugu/gi, 'వైఎస్సార్ కంటి వెలుగు')
    .replace(/YSR\s*Sampoorna\s*Poshana/gi, 'వైఎస్సార్ సంపూర్ణ పోషణ')
    .replace(/PHC/g, 'పీహెచ్‌సీ')
    .replace(/CHC/g, 'సీహెచ్‌సీ')
    .replace(/OPD/g, 'ఓపీడీ')
    .replace(/108/g, 'నూరు ఎనిమిది')
    .replace(/104/g, 'నూరు నాలుగు')
    .replace(/102/g, 'నూరు రెండు')
    .replace(/\bAP\b/g, 'ఆంధ్రప్రదేశ్')
    .replace(/Govt\.?|Government/gi, 'ప్రభుత్వ')
    .replace(/Eligibility:?/gi, 'అర్హత:')
    .replace(/Benefits:?/gi, 'ప్రయోజనాలు:')
    .replace(/Documents:?/gi, 'కావలసిన పత్రాలు:')
    .replace(/Steps:?/gi, 'దరఖాస్తు విధానం:')
    // Replace remaining isolated Latin words if short or keep clean
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || rawText;
}

// Microsoft Edge Neural Text-to-Speech API Endpoint with natural pace & clear voice
app.all(['/api/tts', '/tts'], async (req, res) => {
  try {
    const rawText = ((req.method === 'POST' ? req.body.text : req.query.text) || '').trim();
    const lang = (req.method === 'POST' ? req.body.lang : req.query.lang) || 'te';
    const isSlow = ((req.method === 'POST' ? req.body.slow : req.query.slow) === 'true') || false;
    const requestedVoice = (req.method === 'POST' ? req.body.voice : req.query.voice) || '';

    if (!rawText) {
      return res.status(400).json({ error: 'Text parameter is required for TTS synthesis.' });
    }

    const isEn = lang === 'en';
    // Use clear, pleasant, naturally paced voices
    let voice = requestedVoice;
    if (!voice) {
      voice = isEn ? 'en-IN-NeerjaExpressiveNeural' : 'te-IN-MohanNeural';
    }
    const rate = isSlow ? (isEn ? '-12%' : '-15%') : (isEn ? '-4%' : '-6%');

    // Preprocess text for natural native pronunciation
    const textToSpeak = isEn ? rawText : sanitizeTeluguSpeechText(rawText);

    const hash = crypto.createHash('md5').update(`${voice}:${rate}:${textToSpeak}`).digest('hex');
    const audioDir = path.join(__dirname, 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const cachedFilePath = path.join(audioDir, `tts_${hash}.mp3`);
    if (fs.existsSync(cachedFilePath)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    const { EdgeTTS } = await import('@andresaya/edge-tts');
    const tts = new EdgeTTS({ voice, lang: isEn ? 'en-IN' : 'te-IN', rate });
    await tts.synthesize(textToSpeak.slice(0, 1200), voice, { rate });
    const buffer = await tts.toBuffer();

    // Cache file for high-speed deterministic offline playback
    fs.writeFileSync(cachedFilePath, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Edge TTS synthesis failed:', err.message);
    res.status(500).json({ error: 'TTS audio synthesis failed', details: err.message });
  }
});

// Fast in-memory cache for chat queries to ensure instant sub-second responses
const quickChatCache = new Map();

// System Instruction Builder for SmartGovAI Healthcare Advisor Role
function buildHealthcareAdvisorSystemInstruction(lang = 'te', matchedSchemes = [], roleType = 'advisor') {
  const isEn = lang === 'en';
  // Extract compact scheme summary to minimize token overhead and accelerate response latency
  const compactSchemes = (matchedSchemes || []).slice(0, 3).map(s => ({
    name: s.scheme_name,
    telugu_name: s.telugu_name,
    category: s.category,
    limit: s.financial_limit || s.limit,
    eligibility: isEn ? (s.simplified?.eligibility || s.eligibility) : (s.telugu?.eligibility || s.eligibility),
    benefits: isEn ? (s.simplified?.benefits || s.benefits) : (s.telugu?.benefits || s.benefits),
    steps: isEn ? (s.simplified?.steps || s.steps) : (s.telugu?.steps || s.steps)
  }));
  const schemeJson = JSON.stringify(compactSchemes);

  if (isEn) {
    return `You are SmartGovAI, the official Virtual Healthcare & Welfare Advisor for Andhra Pradesh (AP).
ROLE: Fast, compassionate counselor. Keep responses clear, accurate, and concise (under 160 words).
GUIDELINES:
1. Explain AP health benefits (e.g. Aarogyasri up to ₹25 Lakhs per family per year, free hospital care, maternity aid, pensions).
2. Detail eligibility (White/Rice card, BPL status) and apply steps (Grama Sachivalayam, PHC, Aarogya Mithra).
3. Urgencies: 108 (Ambulance), 104 (Health line), 102 (Mother transport).
4. Format: Bold headers, short bullet points.
RELEVANT SCHEMES: ${schemeJson}`;
  }

  return `మీరు SmartGovAI అధికారిక ఆంధ్రప్రదేశ్ ఆరోగ్య పథకాల సలహాదారు (AP Healthcare Advisor).
పాత్ర: ప్రజలకు వేగవంతమైన, స్నేహపూర్వక సమాధానాలు ఇవ్వండి. సమాధానం స్పష్టంగా, సంక్షిప్తంగా (150 పదాల లోపు) ఉండాలి.
ముఖ్య సమాచారం:
1. ప్రయోజనాలు (ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత చికిత్స, ఉచిత పరీక్షలు, పెన్షన్లు, గర్భిణుల సహాయం).
2. అర్హత (బియ్యం కార్డు / రేషన్ కార్డు) మరియు దరఖాస్తు విధానం (గ్రామ సచివాలయం, PHC, నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్యమిత్ర).
3. హెల్ప్‌లైన్లు: 108 (అంబులెన్స్), 104 (ఆరోగ్య సలహాలు), 102 (తల్లీబిడ్డల వాహనం).
4. ఫార్మాట్: బోల్డ్ హెడ్డింగ్స్, బుల్లెట్ పాయింట్లు.
పథకాల వివరాలు: ${schemeJson}`;
}

// Multi-Turn Chat Endpoint with Gemini + Fast Grounded Fallback
app.post(['/chat', '/api/chat'], async (req, res) => {
  const { question, query, message, history = [], lang = 'te', mode = 'general' } = req.body;
  const userText = (question || query || message || '').trim();

  if (!userText) {
    return res.status(400).json({ error: 'Question or message is required' });
  }

  const isEn = lang === 'en';
  // Context-aware scheme retrieval utilizing both current prompt and recent history
  const matchedSchemes = retrieveRelevantSchemes(userText, lang, 4, history);

  // Fast memory cache check for immediate sub-second response
  const memCacheKey = `${lang}:${userText.toLowerCase()}`;
  if (quickChatCache.has(memCacheKey)) {
    const cached = quickChatCache.get(memCacheKey);
    return res.json({
      response: cached.response,
      matched_schemes: matchedSchemes,
      model_used: 'SmartGov Instant Memory Cache',
      mode,
    });
  }

  // Model Selection: gemini-3.8-flash is the primary high-speed model
  const targetModel = 'gemini-3.8-flash';
  const systemInstruction = buildHealthcareAdvisorSystemInstruction(lang, matchedSchemes, 'advisor');

  // Format previous history into Gemini SDK format:
  // 1. Exclude the current user query if it was appended at the end of history by client
  // 2. Ensure strictly alternating user -> model -> user -> model sequence
  // 3. Ensure history starts with a user turn
  const formattedHistory = [];
  if (Array.isArray(history)) {
    const priorTurns = history.filter((turn) => {
      if (!turn) return false;
      const tText = (turn.text || (turn.parts && turn.parts[0]?.text) || turn.content || '').trim();
      return tText && tText.toLowerCase() !== userText.toLowerCase();
    }).slice(-8);

    let expectedRole = 'user';
    for (const turn of priorTurns) {
      const role = (turn.role === 'assistant' || turn.role === 'bot' || turn.role === 'model') ? 'model' : 'user';
      const text = (turn.text || (turn.parts && turn.parts[0]?.text) || turn.content || '').trim();
      if (!text) continue;

      if (role === expectedRole) {
        formattedHistory.push({
          role,
          parts: [{ text }],
        });
        expectedRole = role === 'user' ? 'model' : 'user';
      }
    }

    // History must end with a model turn so that chat.sendMessage creates the next user turn
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }
  }

  const ai = getGeminiClient();
  let aiResponseText = null;
  let modelUsed = targetModel;

  if (ai) {
    try {
      const chat = ai.chats.create({
        model: targetModel,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 600,
        },
        history: formattedHistory,
      });

      const geminiPromise = chat.sendMessage({ message: userText });
      // Strict 6.0-second timeout so user never waits indefinitely
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 6000)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      aiResponseText = (result.text || '').trim();
    } catch (err) {
      console.warn(`Gemini chat notice (${err.message}): fallback to grounded AP scheme analyzer`);
    }
  }

  if (aiResponseText) {
    quickChatCache.set(memCacheKey, { response: aiResponseText });
    if (quickChatCache.size > 200) {
      const firstKey = quickChatCache.keys().next().value;
      quickChatCache.delete(firstKey);
    }
    logRequest(matchedSchemes[0]?.scheme_name || 'Multi-turn AI Chat', 'chat');
    return res.json({
      response: aiResponseText,
      matched_schemes: matchedSchemes,
      model_used: modelUsed,
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
app.get('/api/facilities', (req, res) => {
  const { lat, lng, type, district, limit = 2000, locale = 'en' } = req.query;
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
  const scheme = schemes[scheme_name];
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }

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
  const adminToken = '12345678';
  if (req.session.admin_authenticated) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === adminToken) {
      return next();
    }
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
  const adminToken = '12345678';

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

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`SmartGov Health running at http://${HOST}:${PORT}`);
});

// Global JSON Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'అనుకోని లోపం (Unexpected error)',
    error_code: err.code || 'UNKNOWN_ERROR'
  });
});
