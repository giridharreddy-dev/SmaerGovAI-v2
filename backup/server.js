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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use('/static', express.static(path.join(__dirname, 'static')));

// Upload configuration for PDF simplification
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
  const id = nextRequestId++;
  db.requests.push({
    id,
    scheme_name: schemeName,
    source,
    timestamp: new Date().toISOString(),
  });
  return id;
}

function saveFeedback(requestId, rating, comment = '') {
  const id = nextFeedbackId++;
  db.feedback.push({
    id,
    request_id: requestId,
    rating: Number(rating) || 0,
    comment,
    timestamp: new Date().toISOString(),
  });
  return id;
}

function getDashboardMetrics() {
  const totalRequests = db.requests.length;
  const totalFeedback = db.feedback.length;
  const totalShares = db.whatsappShares.length;
  let avgRating = 0;
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

function getSchemeStats() {
  const counts = {};
  const ratings = {};
  const ratingCounts = {};

  for (const r of db.requests) {
    counts[r.scheme_name] = (counts[r.scheme_name] || 0) + 1;
  }

  for (const f of db.feedback) {
    const req = db.requests.find((r) => r.id === f.request_id);
    if (req && req.scheme_name) {
      ratings[req.scheme_name] = (ratings[req.scheme_name] || 0) + f.rating;
      ratingCounts[req.scheme_name] = (ratingCounts[req.scheme_name] || 0) + 1;
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
    return new GoogleGenAI({ apiKey });
  }
  return null;
}

// Chat Grounding & Keyword Matching
const ALIASES = {
  ఆరోగ్యశ్రీ: ['Dr. NTR Vaidya Seva', 'వైద్య సేవ', 'cashless', 'hospital'],
  aarogyasri: ['Dr. NTR Vaidya Seva', 'cashless', 'hospital'],
  ఆసుపత్రి: ['hospital', 'treatment'],
  'ఉచిత చికిత్స': ['cashless', 'hospital', 'treatment'],
  'ఉచిత వైద్యం': ['cashless', 'hospital', 'treatment'],
  మందులు: ['medicine', 'medicines', 'drugs'],
  పరీక్షలు: ['tests', 'diagnostics', 'checkup'],
  గర్భం: ['pregnancy', 'maternity', 'maternal', 'గర్భిణి'],
  గర్భిణీ: ['pregnancy', 'maternity', 'maternal', 'గర్భిణి'],
  ప్రసవం: ['delivery', 'maternity', 'institutional delivery'],
  పిల్లల: ['children', 'child health', 'pediatric', 'బాల స్వాస్థ్య', 'newborn'],
  పిల్లలు: ['children', 'child health', 'pediatric', 'బాల స్వాస్థ్య', 'newborn'],
  వృద్ధులు: ['elderly', 'senior citizens', 'geriatric'],
  రక్తహీనత: ['anemia', 'anaemia'],
  కంటి: ['blindness', 'eye'],
  చెవి: ['deafness', 'hearing'],
  రేబిస్: ['rabies', 'dog bite'],
  కిడ్నీ: ['kidney', 'dialysis'],
  క్షయ: ['tb', 'tuberculosis'],
  టీకా: ['vaccination', 'immunization'],
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

function retrieveRelevantSchemes(question, lang = 'te', maxResults = 4) {
  const qLower = question.toLowerCase().replace(/[.,?!'\"(){}\[\]:;-]/g, '');
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

  res.render('index', {
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

  res.render('index', {
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

// Scheme Details and PDF Simplification
app.post('/simplify', upload.single('document'), async (req, res) => {
  try {
    // 1. If uploaded PDF file
    if (req.file) {
      const consent = req.body.consent;
      if (!consent || consent !== 'true') {
        return res.status(400).json({ error: 'Consent is required before uploading documents.' });
      }

      let extractedText = '';
      try {
        const { default: pdfParse } = await import('pdf-parse');
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr) {
        console.warn('PDF parse failed:', pdfErr.message);
        extractedText = 'Sample healthcare scheme document';
      }

      const docSnippet = extractedText.slice(0, 3000);
      const schemeTitle = req.body.scheme_name || 'అప్‌లోడ్ చేసిన పత్రం (Uploaded Document)';

      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `You are SmartGovAI, an assistant that extracts and simplifies Indian government health scheme documents for rural Andhra Pradesh citizens.
Return simple, accurate information based ONLY on the document text.
Return strictly a JSON object with this exact structure:
{
  "simplified": {
    "eligibility": "Who can apply?",
    "benefits": "What do they get?",
    "documents": "What documents are needed?",
    "steps": "How to apply step by step?"
  },
  "telugu": {
    "eligibility": "Telugu translation of eligibility",
    "benefits": "Telugu translation of benefits",
    "documents": "Telugu translation of documents",
    "steps": "Telugu translation of steps"
  }
}

Document:
${docSnippet}`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', temperature: 0.2 },
          });

          const rawText = (response.text || '').trim();
          const parsed = JSON.parse(rawText);
          const reqId = logRequest(schemeTitle, 'pdf_upload');

          return res.json({
            request_id: reqId,
            scheme_name: schemeTitle,
            level: 'Uploaded Document',
            category: 'Health Document',
            source_name: 'User PDF Document',
            source_url: '',
            is_ai_generated: true,
            simplified: parsed.simplified,
            telugu: parsed.telugu,
            voice_url: null,
          });
        } catch (geminiErr) {
          console.error('Gemini PDF simplification error:', geminiErr);
        }
      }

      // Fallback if AI not available
      const reqId = logRequest(schemeTitle, 'pdf_upload_fallback');
      return res.json({
        request_id: reqId,
        scheme_name: schemeTitle,
        level: 'Uploaded Document',
        category: 'Health Document',
        source_name: 'User PDF Document',
        source_url: '',
        is_ai_generated: true,
        simplified: {
          eligibility: 'All eligible residents of Andhra Pradesh as per uploaded guidelines.',
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

    // Check for cached audio
    let voiceUrl = schemeData.voice_url || null;
    if (!voiceUrl && schemeData.audio_file) {
      voiceUrl = `/static/audio/${schemeData.audio_file}`;
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

// Chat Endpoint with Gemini Grounding + Synchronous Fallback
app.post('/chat', async (req, res) => {
  const { question, lang = 'te' } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const isEn = lang === 'en';
  const matchedSchemes = retrieveRelevantSchemes(question, lang, 4);

  const ai = getGeminiClient();
  if (ai && matchedSchemes.length > 0) {
    try {
      const systemPrompt = isEn
        ? `You are an AI assistant for SmartGovAI, a government health scheme information system for Andhra Pradesh, India.
Answer ONLY using the SCHEME DATA provided below.
Respond in clear, simple English using bullet points and short sentences.
NEVER claim the user is definitely eligible; say "you may be eligible".
Mention exact scheme names in English.
Keep response under 250 words.`
        : `You are a Telugu-language assistant for SmartGovAI, a government health scheme information system for Andhra Pradesh, India.
Answer ONLY using the SCHEME DATA provided below.
Respond primarily in Telugu. Use simple, short sentences that elderly and low-literacy users can understand.
Use bullet points. Mention exact scheme names in both Telugu and English.
NEVER claim the user is definitely eligible; say "అర్హత ఉండవచ్చు".
Keep response under 250 words.`;

      const prompt = `${systemPrompt}

SCHEME DATA:
${JSON.stringify(matchedSchemes, null, 2)}

USER QUESTION:
${question}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.3, maxOutputTokens: 600 },
      });

      const text = (response.text || '').trim();
      if (text) {
        logRequest(matchedSchemes[0].scheme_name || 'AI Chat', 'chat');
        return res.json({ response: text, matched_schemes: matchedSchemes });
      }
    } catch (err) {
      console.warn('Gemini chat call failed, using grounded fallback:', err.message);
    }
  }

  // Grounded synchronous catalog fallback
  if (matchedSchemes.length > 0) {
    const top = matchedSchemes[0];
    let responseText = '';
    if (isEn) {
      responseText = `Based on our verified Andhra Pradesh health scheme records:\n\n` +
        `• **${top.scheme_name}** (${top.category})\n` +
        `• **Eligibility**: ${top.eligibility}\n` +
        `• **Benefits**: ${top.benefits}\n` +
        `• **How to apply**: ${top.steps || 'Visit nearest PHC or Village Clinic'}\n\n` +
        `*Note: You may be eligible subject to official government verification at your local secretariat.*`;
    } else {
      responseText = `ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆరోగ్య పథకాల వివరాలు:\n\n` +
        `• **${top.telugu_name} (${top.scheme_name})**\n` +
        `• **అర్హత**: ${top.eligibility}\n` +
        `• **ప్రయోజనాలు**: ${top.benefits}\n` +
        `• **దరఖాస్తు విధానం**: ${top.steps || 'సమీప విలేజ్ క్లినిక్ లేదా గ్రామ సచివాలయాన్ని సంప్రదించండి.'}\n\n` +
        `*గమనిక: తుది నిర్ధారణ కొరకు అధికారిక ఆసుపత్రి లేదా సచివాలయాన్ని సందర్శించండి.*`;
    }
    logRequest(top.scheme_name, 'chat_fallback');
    return res.json({ response: responseText, matched_schemes: matchedSchemes });
  }

  const defaultMsg = isEn
    ? 'Sorry, SmartGovAI provides information on Andhra Pradesh government health schemes such as Dr. NTR Vaidya Seva (Aarogyasri), Maternal Care, Free Medicines, and Child Health. Please ask about a health condition, hospital care, or medical scheme.'
    : 'క్షమించండి. SmartGovAI ప్రస్తుతం ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆరోగ్య పథకాలైన ఆరోగ్యశ్రీ, గర్భిణుల సంరక్షణ, ఉచిత మందులు, మరియు పిల్లల ఆరోగ్యంపై సమాచారాన్ని అందిస్తుంది. దయచేసి ఆరోగ్య పథకాలు లేదా చికిత్స గురించి అడగండి.';

  return res.json({ response: defaultMsg, matched_schemes: [] });
});

// Feedback Endpoint
app.post('/feedback', (req, res) => {
  const { request_id, rating, comment = '' } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  const id = saveFeedback(request_id, rating, comment);
  res.json({ status: 'success', feedback_id: id });
});

// Enhanced Community Feedback
app.post('/enhanced-feedback', (req, res) => {
  const { scheme_name, rating, feedback_text = '', village = '', issue_type = 'general' } = req.body;
  const id = nextFeedbackId++;
  db.staffFeedback.push({
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    rating: Number(rating) || 5,
    timestamp: new Date().toISOString(),
  });
  res.json({ status: 'success', id });
});

// Staff Issue Report
app.post('/staff-report', (req, res) => {
  const { scheme_name, village = '', feedback_text = '', issue_type = 'grievance' } = req.body;
  const id = nextFeedbackId++;
  db.staffFeedback.push({
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    timestamp: new Date().toISOString(),
  });
  res.json({ status: 'success', id });
});

// WhatsApp Share Logging
app.post('/whatsapp-share', (req, res) => {
  const { scheme_name } = req.body;
  if (scheme_name) {
    db.whatsappShares.push({
      scheme_name,
      timestamp: new Date().toISOString(),
    });
  }
  res.json({ status: 'success' });
});

// AP Health Facilities API
app.get('/api/facilities', (req, res) => {
  const { lat, lng, type, district, limit = 50 } = req.query;
  let results = [...facilitiesData];

  if (type && type !== 'all' && type !== 'none') {
    results = results.filter((f) => (f.facility_type || '').toUpperCase() === type.toUpperCase());
  }

  if (district) {
    results = results.filter((f) => (f.district || '').toLowerCase().includes(district.toLowerCase()));
  }

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      results = results.map((f) => {
        const d = calculateDistance(userLat, userLng, f.latitude, f.longitude);
        return { ...f, distance_km: Number(d.toFixed(2)) };
      });
      results.sort((a, b) => a.distance_km - b.distance_km);
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
  const adminToken = process.env.ADMIN_TOKEN ? process.env.ADMIN_TOKEN.trim() : 'admin123';
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
  const adminToken = process.env.ADMIN_TOKEN ? process.env.ADMIN_TOKEN.trim() : 'admin123';

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
app.get('/analytics', requireAdmin, (req, res) => {
  const metrics = getDashboardMetrics();
  const stats = getSchemeStats();
  res.render('analytics', { metrics, stats });
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`SmartGov Health running at http://${HOST}:${PORT}`);
});
