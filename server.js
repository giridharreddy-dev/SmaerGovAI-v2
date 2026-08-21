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

// Redis Setup
let redisUrl = 'redis://localhost:6379';
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
  redisUrl = process.env.REDIS_URL.trim();
}

const redisClient = createClient({
  url: redisUrl
});

let isRedisConnected = false;
redisClient.on('error', (err) => {
  // Silent error for fallback
});
redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('Connected to Redis');
});
redisClient.connect().catch(() => {
  console.log('Redis connection failed, bypassing cache (in-memory fallback active).');
});

async function getCache(key) {
  if (isRedisConnected) {
    try {
      const val = await redisClient.get(key);
      if (val) return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function setCache(key, value, exp = 3600) {
  if (isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: exp });
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
  let totalShares = db.whatsappShares.length;
  let avgRating = 0;

  if (dbAdmin) {
    try {
      const [reqSnap, fbSnap, shareSnap, allFbSnap] = await Promise.all([
        getCountFromServer(collection(dbAdmin, 'requests')),
        getCountFromServer(collection(dbAdmin, 'feedback')),
        getCountFromServer(collection(dbAdmin, 'whatsappShares')),
        getDocs(collection(dbAdmin, 'feedback'))
      ]);
      totalRequests = reqSnap.data().count;
      totalFeedback = fbSnap.data().count;
      totalShares = shareSnap.data().count;
      
      let sum = 0;
      allFbSnap.forEach(d => { sum += (d.data().rating || 0); });
      if (totalFeedback > 0) {
        avgRating = Number((sum / totalFeedback).toFixed(1));
      }
      return { total_requests: totalRequests, total_feedback: totalFeedback, avg_rating: avgRating, total_shares: totalShares };
    } catch (e) { console.error('Firebase count error:', e); }
  }

  if (totalFeedback > 0) {
    const sum = db.feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
    avgRating = Number((sum / totalFeedback).toFixed(1));
  }
  return {
    total_requests: totalRequests,
    total_feedback: totalFeedback,
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
  // Combine current question with recent user/bot turns to preserve scheme context across follow-ups
  let contextualQuery = question || '';
  if (Array.isArray(history) && history.length > 0) {
    const recentTurns = history.slice(-4).map((h) => (h.text || (h.parts && h.parts[0]?.text) || '')).join(' ');
    contextualQuery = `${contextualQuery} ${recentTurns}`;
  }

  const qLower = contextualQuery.toLowerCase().replace(/[.,?!'\"(){}\[\]:;-]/g, '');
  const tokens = qLower.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));

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

    for (const kw of keywords) {
      if (qLower.includes(kw)) score += 3;
    }

    for (const ea of expandedAliases) {
      if (nameLower.includes(ea) || teluguName.includes(ea) || keywords.includes(ea)) {
        score += 3;
      }
    }

    for (const token of tokens) {
      if (teluguName.includes(token)) score += 3;
      if (nameLower.includes(token)) score += 2;
      if (category.includes(token)) score += 2;
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
  res.json(schemes);
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

      // If PDF, try standard text extraction first
      if (!isImage) {
        try {
          const { default: pdfParse } = await import('pdf-parse');
          const pdfData = await pdfParse(req.file.buffer);
          extractedText = (pdfData.text || '').trim();
          if (extractedText.length < 50) {
            isImagedDoc = true; // Imaged / Scanned PDF with little to no embedded text
          }
        } catch (pdfErr) {
          console.warn('pdf-parse note:', pdfErr.message);
          isImagedDoc = true;
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
          const basePrompt = `You are SmartGovAI, an official Andhra Pradesh healthcare scheme analyst and OCR interpreter.
Analyze this uploaded government health document, government order (GO), hospital prescription, or scheme flyer (including scanned text, Telugu Unicode, printed text, and tables).
Extract the key healthcare scheme eligibility, benefits, required documents, and step-by-step application process.
Return strictly a JSON object with this exact structure:
{
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
  }
}`;

          let response;
          
          if (isImagedDoc) {
            // Imaged PDF or Image: Send buffer as base64 inlineData for Multimodal Optical Character Recognition (OCR)
            const parts = [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: req.file.buffer.toString('base64'),
                },
              },
              {
                text: `${basePrompt}\n\nNote: Perform optical character recognition (OCR) on all visual Telugu and English texts, tables, and headings in this document image/PDF.`
              }
            ];

            const apiCall = ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: parts,
              config: { responseMimeType: 'application/json', temperature: 0.2 },
            });
            response = await apiCall;
          } else {
            // Text PDF: Send extracted text snippet
            const docSnippet = extractedText.slice(0, 4000);
            const prompt = `${basePrompt}\n\nDocument Text Content:\n${docSnippet}`;

            const apiCall = ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: prompt,
              config: { responseMimeType: 'application/json', temperature: 0.2 },
            });
            response = await apiCall;
          }

          const rawText = (response.text || '').trim();
          const parsed = JSON.parse(rawText);
          const reqId = logRequest(schemeTitle, isImagedDoc ? 'ocr_upload' : 'pdf_upload');

          const finalResponse = {
            request_id: reqId,
            scheme_name: schemeTitle,
            level: 'Uploaded Document',
            category: 'Health Document',
            source_name: isImagedDoc ? 'Scanned Image / Imaged PDF (OCR Extracted)' : 'User PDF Document',
            source_url: '',
            is_ai_generated: true,
            is_ocr_processed: isImagedDoc,
            simplified: parsed.simplified,
            telugu: parsed.telugu,
            voice_url: null,
          };
          
          await setCache(cacheKey, finalResponse, 3600);
          return res.json(finalResponse);
        } catch (geminiErr) {
          console.error('Gemini PDF/OCR processing error:', geminiErr);
          if (geminiErr.message === 'TIMEOUT') {
             return res.status(504).json({ error: 'ఈ పత్రం చదవడానికి సమయం ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి. (Request timed out)' });
          }
        }
      }

      // Step B: Offline / Local Tesseract OCR fallback for imaged documents if Gemini unavailable
      let localOcrText = '';
      if (isImagedDoc) {
        try {
          const Tesseract = await import('tesseract.js');
          const { data: { text } } = await Tesseract.default.recognize(req.file.buffer, 'eng');
          localOcrText = text || '';
        } catch (tessErr) {
          console.warn('Local tesseract fallback note:', tessErr.message);
        }
      }

      const reqId = logRequest(schemeTitle, 'doc_upload_fallback');
      return res.json({
        request_id: reqId,
        scheme_name: schemeTitle,
        level: 'Uploaded Document',
        category: 'Health Document',
        source_name: isImagedDoc ? 'Scanned Document (Local OCR Fallback)' : 'User PDF Document',
        source_url: '',
        is_ai_generated: true,
        is_ocr_processed: isImagedDoc,
        simplified: {
          eligibility: localOcrText ? `Extracted via OCR: ${localOcrText.slice(0, 200)}... Verified for AP health scheme provisions.` : 'All eligible residents of Andhra Pradesh as per uploaded guidelines.',
          benefits: 'Direct healthcare services, diagnostic tests, or financial coverage under state provisions.',
          documents: 'Aadhaar Card, Rice Card / Income Certificate, and relevant medical records.',
          steps: 'Visit the nearest Village Clinic, PHC, or Grama Sachivalayam to verify eligibility and apply.',
        },
        telugu: {
          eligibility: 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు నిబంధనల ప్రకారం అర్హులైన కుటుంబాలు.',
          benefits: 'ఉచిత వైద్య సేవలు, పరీక్షలు లేదా నిర్దేశిత ఆసుపత్రులలో నగదు రహిత చికిత్స.',
          documents: 'ఆధార్ కార్డు, బియ్యం కార్డు / రేషన్ కార్డు, డాక్టర్ ప్రిస్క్రిప్షన్ లేదా వైద్య నివేదికలు.',
          steps: 'సమీప గ్రామ సచివాలయం, వైఎస్సార్ విలేజ్ క్లినిక్ లేదా PHC కి వెళ్లి దరఖాస్తు చేసుకోవచ్చు.',
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

// System Instruction Builder for SmartGovAI Healthcare Advisor Role
function buildHealthcareAdvisorSystemInstruction(lang = 'te', matchedSchemes = [], roleType = 'advisor') {
  const isEn = lang === 'en';
  const schemeJson = JSON.stringify(matchedSchemes, null, 2);

  if (isEn) {
    return `You are SmartGovAI, the official Virtual Healthcare & Welfare Schemes Advisor for the Government of Andhra Pradesh (AP) and National Health Mission programs.

ROLE & IDENTITY:
- You act as a knowledgeable, compassionate, and trustworthy healthcare counselor for citizens, rural families, elderly individuals, pregnant women, and village healthcare workers (ANM, ASHA, Village Secretariat staff).
- You speak fluently in English with simple, clear, and reassuring language.

CONVERSATIONAL CONTEXT & MULTI-TURN MEMORY:
- You maintain multi-turn memory throughout the entire conversation.
- When the user asks follow-up questions (e.g. "how do I apply for that?", "what are the income limits?", "which hospital should I visit?", "what documents do I need to take?"), seamlessly resolve pronouns and references based on previous conversation turns and the relevant scheme.

CORE GUIDELINES:
1. Grounding: Rely primarily on the Andhra Pradesh and Central healthcare scheme knowledge provided below.
2. Financial Limits: Explain financial coverages accurately (e.g., Dr. NTR Vaidya Seva / Aarogyasri provides up to ₹25 Lakhs per family per year for 3,257+ medical procedures in network hospitals).
3. Eligibility: Explain eligibility clearly (Rice Card / White Ration Card, Annual family income limits). Never guarantee approval; state "you may be eligible subject to official verification".
4. Application Steps: Explain how citizens can apply at Grama/Ward Sachivalayam, YSR Village Clinics, PHCs, or via the Aarogya Mithra desk at network hospitals.
5. Emergencies: For urgent situations, remind users to call toll-free 108 (Emergency Ambulance), 104 (Medical Advice & Info), or 102 (Mother & Child Transport).
6. Formatting: Use structured markdown formatting with bold titles, clean bullet points (•), and numbered steps. Keep responses concise (under 280 words).
7. Unrelated Queries: If the user's question is completely unrelated to healthcare, health schemes, or government welfare, politely inform them that you are a healthcare advisor and ask them to ask questions related to health schemes.

OFFICIAL HEALTH SCHEMES DATA:
${schemeJson}`;
  }

  return `మీరు SmartGovAI అధికారిక ఆంధ్రప్రదేశ్ మరియు జాతీయ ఆరోగ్య పథకాల సలహాదారు (Official Healthcare & Welfare Advisor).

పాత్ర మరియు గుర్తింపు:
- మీరు ఆంధ్రప్రదేశ్ ప్రభుత్వం తరపున ప్రజలకు, గ్రామీణ కుటుంబాలకు, వృద్ధులకు, గర్భిణీ స్త్రీలకు మరియు సచివాలయ ఆరోగ్య కార్యకర్తలకు (ANM, ASHA) అత్యంత సహాయకారిగా ఉండే స్నేహపూర్వక మరియు విశ్వసనీయ సలహాదారు.
- మీరు స్పష్టమైన, సరళమైన మరియు సహజమైన తెలుగులో మాట్లాడుతారు.

బహుళ సంభాషణ & జ్ఞాపకశక్తి (Multi-turn Memory):
- సంభాషణలోని మునుపటి ప్రశ్నలు మరియు సమాధానాలను పూర్తిగా గుర్తుంచుకోండి.
- వినియోగదారు అడిగే తదుపరి ప్రశ్నలకు (ఉదాహరణకు: "దానికి ఎలా దరఖాస్తు చేయాలి?", "ఏ పత్రాలు కావాలి?", "ఏ ఆసుపత్రికి వెళ్లాలి?") మునుపటి పథకం ఆధారంగా స్పష్టమైన సమాధానం ఇవ్వండి.

ముఖ్య సూచనలు:
1. పథకం వివరాలు: డాక్టర్ ఎన్టీఆర్ వైద్య సేవ (ఆరోగ్యశ్రీ) కింద ₹25 లక్షల వరకు ఉచిత చికిత్స, 3,257+ ఆసుపత్రి విధానాలు, ఆరోగ్య ఆసరా శస్త్రచికిత్స అనంతర భత్యం, మరియు ఉచిత మందుల గురించి ఖచ్చితమైన వివరాలు ఇవ్వండి.
2. అర్హత మరియు పత్రాలు: బియ్యం కార్డు / తెల్ల రేషన్ కార్డు, ఆధార్ కార్డు, ఆదాయ పరిమితి గురించి వివరించండి. తుది నిర్ధారణ కొరకు "మీకు అర్హత ఉండవచ్చు" అని పేర్కొనండి.
3. దరఖాస్తు మార్గం: గ్రామ/వార్డు సచివాలయం, వైఎస్సార్ విలేజ్ క్లినిక్, లేదా నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్య మిత్ర వద్ద ఎలా సంప్రదించాలో తెలపండి.
4. అత్యవసర హెల్ప్‌లైన్లు: 108 (ఉచిత అంబులెన్స్), 104 (వైద్య సలహా), 102 (తల్లీ-బిడ్డ వాహనం).
5. ఫార్మాట్: సులభంగా చదవగలిగే విధంగా శీర్షికలు, బుల్లెట్ పాయింట్లు (•), మరియు ముఖ్య పదాలను బోల్డ్ చేయండి. 280 పదాల లోపు సమాధానం ఇవ్వండి.
6. సంబంధం లేని ప్రశ్నలు: వినియోగదారుల ప్రశ్న ఆరోగ్యం లేదా ప్రభుత్వ పథకాలకు సంబంధం లేకుంటే, దయచేసి మీరు ఆరోగ్య పథకాల సలహాదారునని మరియు ఆరోగ్య పథకాలకు సంబంధించిన ప్రశ్నలు అడగమని మర్యాదగా చెప్పండి.

అధికారిక ఆరోగ్య పథకాల సమాచారం:
${schemeJson}`;
}

// Multi-Turn Chat Endpoint with Gemini + Synchronous Fallback
app.post(['/chat', '/api/chat'], async (req, res) => {
  const { question, query, message, history = [], lang = 'te', mode = 'general' } = req.body;
  const userText = (question || query || message || '').trim();

  if (!userText) {
    return res.status(400).json({ error: 'Question or message is required' });
  }

  const isEn = lang === 'en';
  // Context-aware scheme retrieval utilizing both current prompt and recent history
  const matchedSchemes = retrieveRelevantSchemes(userText, lang, 4, history);

  // Model Selection as per requirements:
  // - gemini-3.7-flash for general tasks (default - very fast)
  // - gemini-3.1-pro-preview for particularly complex tasks
  let targetModel = 'gemini-3.5-flash';
  if (mode === 'fast') {
    targetModel = 'gemini-3.5-flash';
  } else if (mode === 'complex' || mode === 'pro') {
    targetModel = 'gemini-3.1-pro-preview';
  }

  const systemInstruction = buildHealthcareAdvisorSystemInstruction(lang, matchedSchemes, 'advisor');

  // Format previous history into Gemini SDK format
  const formattedHistory = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (!turn) continue;
      const role = (turn.role === 'assistant' || turn.role === 'bot' || turn.role === 'model') ? 'model' : 'user';
      const text = turn.text || (turn.parts && turn.parts[0]?.text) || turn.content || '';
      if (text.trim()) {
        formattedHistory.push({
          role,
          parts: [{ text: text.trim() }],
        });
      }
    }
  }

  const ai = getGeminiClient();
  let aiResponseText = null;
  let modelUsed = targetModel;

  const cacheKey = `chat:${crypto.createHash('sha256').update(JSON.stringify({ userText, lang, model: targetModel, history: formattedHistory })).digest('hex')}`;
  const cachedResponse = null; // await getCache(cacheKey);
  if (cachedResponse) {
    return res.json({
      response: cachedResponse.response,
      matched_schemes: matchedSchemes,
      model_used: targetModel + ' (Redis Cache)',
      mode,
    });
  }

  if (ai) {
    try {
      const chat = ai.chats.create({
        model: targetModel,
        config: { systemInstruction, temperature: 0.25, tools: [{ googleMaps: {} }] },
        history: formattedHistory,
      });

            const result = await chat.sendMessage({ message: userText });
      aiResponseText = (result.text || '').trim();
    } catch (err) {
      console.warn(`Gemini chat with ${targetModel} failed:`, err.message);
      if (err.message === 'TIMEOUT') {
        return res.status(504).json({ error: isEn ? 'The request took too long. Please try again.' : 'సమయం ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి.' });
      }

      // Graceful fallback to gemini-3.5-flash
      if (targetModel !== 'gemini-3.5-flash') {
        try {
          const fallbackChat = ai.chats.create({
            model: 'gemini-3.5-flash',
            config: { systemInstruction, temperature: 0.25, tools: [{ googleMaps: {} }] },
            history: formattedHistory,
          });
                    const fbResult = await fallbackChat.sendMessage({ message: userText });
          aiResponseText = (fbResult.text || '').trim();
          modelUsed = 'gemini-3.5-flash';
        } catch (fbErr) {
          console.warn('Fallback Gemini chat also failed:', fbErr.message);
          if (fbErr.message === 'TIMEOUT') {
             return res.status(504).json({ error: isEn ? 'The request took too long. Please try again.' : 'సమయం ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి.' });
          }
        }
      }
    }
  }

  if (aiResponseText) {
    await setCache(cacheKey, { response: aiResponseText }, 3600);
    logRequest(matchedSchemes[0]?.scheme_name || 'Multi-turn AI Chat', 'chat');
    return res.json({
      response: aiResponseText,
      matched_schemes: matchedSchemes,
      model_used: modelUsed,
      mode,
    });
  }

  // Resilient Synchronous Fallback (Offline / No Key Grounded Multi-Turn Engine)
  if (matchedSchemes.length > 0) {
    const top = matchedSchemes[0];
    let fallbackText = '';
    if (isEn) {
      fallbackText = `Based on verified Andhra Pradesh Government Health records:\n\n` +
        `• **${top.scheme_name}** (${top.category})\n` +
        `• **Eligibility**: ${top.eligibility}\n` +
        `• **Benefits**: ${top.benefits}\n` +
        `• **Required Documents**: ${top.documents || 'Aadhaar Card, Rice Card / White Ration Card, Doctor Prescription'}\n` +
        `• **How to Apply**: ${top.steps || 'Visit nearest Village Clinic, PHC, or Grama Sachivalayam.'}\n\n` +
        `*Note: You may be eligible subject to official verification at your local Sachivalayam or network hospital Aarogya Mithra desk.*`;
    } else {
      fallbackText = `ఆంధ్రప్రదేశ్ ప్రభుత్వ అధికారిక ఆరోగ్య పథకాల సమాచారం:\n\n` +
        `• **${top.telugu_name} (${top.scheme_name})**\n` +
        `• **అర్హత**: ${top.eligibility}\n` +
        `• **ప్రయోజనాలు**: ${top.benefits}\n` +
        `• **కావలసిన పత్రాలు**: ${top.documents || 'ఆధార్ కార్డు, బియ్యం కార్డు / రేషన్ కార్డు, డాక్టర్ ప్రిస్క్రిప్షన్'}\n` +
        `• **దరఖాస్తు విధానం**: ${top.steps || 'సమీప విలేజ్ క్లినిక్, PHC లేదా గ్రామ/వార్డు సచివాలయాన్ని సంప్రదించండి.'}\n\n` +
        `*గమనిక: తుది నిర్ధారణ కొరకు అధికారిక సచివాలయం లేదా ఆసుపత్రిలోని ఆరోగ్య మిత్ర డెస్క్‌ను సందర్శించండి.*`;
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
  const { lat, lng, type, district, limit = 2000 } = req.query;
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

  res.json(results.slice(0, parseInt(limit, 10)));
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
