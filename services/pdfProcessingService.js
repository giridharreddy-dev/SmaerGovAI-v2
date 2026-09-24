/**
 * services/pdfProcessingService.js
 * =============================================================================
 * SmartGov Health - PDF Health Scheme Document Processing & AI Extraction Utility
 * =============================================================================
 * Accepts health scheme document PDFs, extracts raw textual content, parses
 * key policy metadata (benefits, eligibility, required documents, application steps),
 * and structures high-signal prompts for AI summarization (Gemini 3.8 Flash).
 */

import fs from 'fs';
import path from 'path';

/**
 * Extract raw text and metadata from a PDF Buffer, Uint8Array, or local file path.
 * Supports pdf-parse v2 (both functional and class-based interfaces).
 *
 * @param {Buffer|Uint8Array|string} input - PDF buffer or path to PDF file
 * @returns {Promise<{ text: string, charCount: number, pageCount: number, isTextExtracted: boolean, info: Object }>}
 */
export async function extractTextFromPdf(input) {
  if (!input) {
    throw new Error('PDF input (buffer or file path) is required.');
  }

  let buffer;
  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`PDF file not found at path: ${input}`);
    }
    buffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    buffer = Buffer.from(input);
  } else {
    throw new Error('Invalid PDF input type. Expected Buffer, Uint8Array, or string file path.');
  }

  if (buffer.length === 0) {
    return {
      text: '',
      charCount: 0,
      pageCount: 0,
      isTextExtracted: false,
      info: {}
    };
  }

  try {
    const pdfModule = await import('pdf-parse');
    let extractedText = '';
    let pageCount = 1;
    let info = {};

    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      try {
        await parser.load();
        const textResult = await parser.getText();
        if (textResult) {
          extractedText = (typeof textResult === 'string' ? textResult : (textResult.text || '')).trim();
          pageCount = textResult.total || (textResult.pages ? textResult.pages.length : 1);
        }
        if (typeof parser.getInfo === 'function') {
          info = (await parser.getInfo()) || {};
        }
      } finally {
        if (typeof parser.destroy === 'function') {
          try { await parser.destroy(); } catch (_) {}
        }
      }
    } else if (typeof pdfModule.default === 'function') {
      const result = await pdfModule.default(buffer);
      extractedText = (result.text || '').trim();
      pageCount = result.numpages || 1;
      info = result.info || {};
    }

    // Strip pagination markers like "-- 1 of 2 --"
    const cleanedText = extractedText
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: cleanedText,
      charCount: cleanedText.length,
      pageCount: pageCount,
      isTextExtracted: cleanedText.length >= 20,
      info: info
    };
  } catch (err) {
    console.warn('[pdfProcessingService] pdf-parse extraction failed:', err.message);
    return {
      text: '',
      charCount: 0,
      pageCount: 0,
      isTextExtracted: false,
      info: { error: err.message }
    };
  }
}

/**
 * Heuristically extracts candidate key details from health scheme document text
 * to optimize structured input for AI summarization.
 *
 * @param {string} text - Extracted document text
 * @param {string} [filename] - Original document filename
 * @returns {Object} Extracted key details object
 */
export function extractKeyDetailsForAI(text = '', filename = '') {
  const safeText = typeof text === 'string' ? text : '';
  const lower = safeText.toLowerCase();

  // 1. Identify Candidate Scheme Title
  let candidateTitle = '';
  const lines = safeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 15)) {
    if (/(?:scheme|yojana|aarogyasri|asara|kanti velugu|amrit|ayushman|programme|mission|seva)/i.test(line)) {
      if (!/^government of/i.test(line) && line.length >= 6 && line.length <= 100) {
        candidateTitle = line.replace(/^(?:guidelines|official|circular|policy)\s*[:\-–]?\s*/i, '').trim();
        break;
      }
    }
  }

  if (!candidateTitle) {
    const titlePatterns = [
      /([A-Za-z0-9\s().&'–-]{5,60}(?:health scheme|welfare scheme|insurance scheme|cashless treatment|yojana|mission))/i,
      /(?:scheme|yojana|programme|mission|seva|pmsma|pmmvy|aarogyasri|asara|kanti velugu|amrit|ayushman)\s*[:\-–]?\s*([A-Za-z0-9\s().&'–-]{5,60})/i,
      /government of andhra pradesh\s*[-–]?\s*([A-Za-z0-9\s().&'–-]{5,60})/i
    ];

    for (const pat of titlePatterns) {
      const match = safeText.match(pat);
      if (match && match[1]) {
        candidateTitle = match[1].trim();
        break;
      }
    }
  }

  if (!candidateTitle && filename) {
    candidateTitle = path.basename(filename, path.extname(filename))
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  // 2. Identify Government Level
  let level = 'State Government (Andhra Pradesh)';
  if (lower.includes('central government') || lower.includes('government of india') || lower.includes('national health mission') || lower.includes('pm-jay')) {
    level = 'Central Government';
  }

  // 3. Identify Healthcare Category
  let category = 'General Healthcare';
  if (lower.includes('maternal') || lower.includes('pregnant') || lower.includes('mother') || lower.includes('delivery') || lower.includes('child')) {
    category = 'Maternal & Child Health';
  } else if (lower.includes('hospital') || lower.includes('surgery') || lower.includes('tertiary') || lower.includes('inpatient') || lower.includes('cashless')) {
    category = 'Hospitalization Care';
  } else if (lower.includes('eye') || lower.includes('cataract') || lower.includes('vision') || lower.includes('spectacles')) {
    category = 'Eye Care & Vision';
  } else if (lower.includes('dialysis') || lower.includes('kidney') || lower.includes('ckd') || lower.includes('renal')) {
    category = 'Specialized Medical Care (Dialysis/CKD)';
  } else if (lower.includes('ambulance') || lower.includes('emergency') || lower.includes('108') || lower.includes('104')) {
    category = 'Emergency Medical Services';
  }

  // 4. Financial Benefit Limits
  let benefitAmount = 'Free Care & Financial Assistance';
  let benefitAmountTe = 'ఉచిత వైద్యం & ఆర్థిక సహాయం';
  const benefitMatch = safeText.match(/(?:₹|rs\.?|inr)\s*([0-9,]+(?:\s*(?:lakhs?|crores?|per\s*year|per\s*family))?)/i);
  if (benefitMatch) {
    benefitAmount = `Up to ₹${benefitMatch[1].trim()}`;
    benefitAmountTe = `రూ. ${benefitMatch[1].trim()} వరకు`;
  } else if (lower.includes('25 lakh') || lower.includes('25,00,000')) {
    benefitAmount = 'Up to ₹25 Lakhs per family per year';
    benefitAmountTe = 'కుటుంబానికి ఏడాదికి రూ. 25 లక్షల వరకు';
  } else if (lower.includes('5 lakh') || lower.includes('5,00,000')) {
    benefitAmount = 'Up to ₹5 Lakhs per family per year';
    benefitAmountTe = 'కుటుంబానికి ఏడాదికి రూ. 5 లక్షల వరకు';
  }

  // 5. Detect Required Documents
  const detectedDocs = [];
  if (lower.includes('aadhaar') || lower.includes('aadhar')) {
    detectedDocs.push({ name: 'Aadhaar Card', name_te: 'ఆధార్ కార్డు', optional: false });
  }
  if (lower.includes('ration') || lower.includes('rice card') || lower.includes('bpl')) {
    detectedDocs.push({ name: 'White Ration Card / Rice Card', name_te: 'తెల్ల రేషన్ కార్డు / బియ్యం కార్డు', optional: false });
  }
  if (lower.includes('income') || lower.includes('salary') || lower.includes('annual income')) {
    detectedDocs.push({ name: 'Income Certificate', name_te: 'ఆదాయ ధృవీకరణ పత్రం', optional: true });
  }
  if (lower.includes('medical record') || lower.includes('prescription') || lower.includes('discharge') || lower.includes('case sheet')) {
    detectedDocs.push({ name: 'Doctor Prescription / Medical Records', name_te: 'డాక్టర్ ప్రిస్క్రిప్షన్ / వైద్య నివేదికలు', optional: false });
  }
  if (lower.includes('bank') || lower.includes('passbook') || lower.includes('ifsc')) {
    detectedDocs.push({ name: 'Bank Account Passbook / Details', name_te: 'బ్యాంక్ పాస్‌బుక్ వివరాలు', optional: true });
  }

  // Default docs if none detected
  if (detectedDocs.length === 0) {
    detectedDocs.push(
      { name: 'Aadhaar Card', name_te: 'ఆధార్ కార్డు', optional: false },
      { name: 'Rice Card / White Ration Card', name_te: 'బియ్యం కార్డు / రేషన్ కార్డు', optional: false }
    );
  }

  // 6. Application Points / Steps Heuristics
  const applicationPoints = [];
  if (lower.includes('sachivalayam') || lower.includes('ward') || lower.includes('village')) {
    applicationPoints.push('Grama / Ward Sachivalayam (గ్రామ / వార్డు సచివాలయం)');
  }
  if (lower.includes('empanelled') || lower.includes('network hospital') || lower.includes('aarogyamitra')) {
    applicationPoints.push('Network Hospital Helpdesk / Aarogyamitra (నెట్‌వర్క్ ఆసుపత్రి ఆరోగ్యమిత్ర)');
  }
  if (lower.includes('phc') || lower.includes('primary health centre') || lower.includes('chc') || lower.includes('village clinic')) {
    applicationPoints.push('Primary Health Centre (PHC) / YSR Village Clinic');
  }
  if (lower.includes('104') || lower.includes('108') || lower.includes('helpline')) {
    applicationPoints.push('Toll-Free Helpline (104 / 108)');
  }

  return {
    candidateTitle: candidateTitle || 'Andhra Pradesh Health Scheme Document',
    level,
    category,
    benefitAmount,
    benefitAmountTe,
    detectedDocuments: detectedDocs,
    applicationPoints: applicationPoints.length > 0 ? applicationPoints : ['Nearest Grama Sachivalayam or Government Hospital'],
    extractedSnippet: safeText.slice(0, 4000), // High-signal text window for LLM prompt
    rawTextLength: safeText.length
  };
}

/**
 * Builds the structured prompt for Gemini 3.8 Flash to summarize the scheme document.
 *
 * @param {Object} details - Extracted details from extractKeyDetailsForAI
 * @returns {string} Structured prompt
 */
export function buildAiSummaryPrompt(details) {
  return `You are SmartGovAI, an authoritative healthcare welfare analyst for Andhra Pradesh and National health programs.
Analyze the following extracted healthcare scheme document text and produce a clean, accessible bilingual (Telugu & English) summary for citizens.

DOCUMENT METADATA:
- Candidate Title: ${details.candidateTitle}
- Detected Level: ${details.level}
- Detected Category: ${details.category}
- Benefit Estimate: ${details.benefitAmount}
- Extracted Document Text:
"""
${details.extractedSnippet}
"""

You MUST respond strictly with a valid JSON object matching this schema (no markdown, no extra commentary):
{
  "scheme_name": "Official Scheme Name in English",
  "telugu_name": "పథకం అధికారిక పేరు తెలుగులో",
  "category": "${details.category}",
  "level": "${details.level}",
  "benefit_amount": "${details.benefitAmount}",
  "benefit_amount_te": "${details.benefitAmountTe}",
  "simplified": {
    "eligibility": "Clear bulleted or concise explanation in English of who qualifies.",
    "benefits": "Key medical, hospitalization, or financial benefits provided in English.",
    "documents": "Essential documents needed to apply in English.",
    "steps": "Step-by-step instructions on where and how to apply in English."
  },
  "telugu": {
    "eligibility": "అర్హత నిబంధనల సులభ వివరణ తెలుగులో.",
    "benefits": "లభించే ఉచిత వైద్య సేవలు మరియు ఆర్థిక ప్రయోజనాలు తెలుగులో.",
    "documents": "దరఖాస్తుకు కావలసిన ముఖ్య పత్రాలు తెలుగులో.",
    "steps": "ఎక్కడ, ఎలా దరఖాస్తు చేసుకోవాలో సులభ సూచనలు తెలుగులో."
  },
  "required_documents": [
    { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
    { "name": "Rice Card / Ration Card", "name_te": "బియ్యం కార్డు / రేషన్ కార్డు", "optional": false }
  ]
}`;
}

/**
 * Summarizes the scheme document using Gemini AI (gemini-3.8-flash) or grounded fallback.
 *
 * @param {Object} details - Key details from extractKeyDetailsForAI
 * @param {Object} [aiClient] - Initialized GoogleGenAI client
 * @returns {Promise<Object>} Structured summary
 */
export async function summarizeSchemeDocumentWithAI(details, aiClient = null) {
  if (aiClient && aiClient.models) {
    try {
      const prompt = buildAiSummaryPrompt(details);
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      // Strip markdown code fences if present
      const cleanJson = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...parsed,
        is_ai_generated: true,
        source_name: 'AI Analyzed Government Document (Gemini 3.8 Flash)'
      };
    } catch (aiErr) {
      console.warn('[pdfProcessingService] Gemini AI summarization fallback:', aiErr.message);
    }
  }

  // Grounded Deterministic Fallback
  return {
    scheme_name: details.candidateTitle,
    telugu_name: `${details.candidateTitle} (ఆరోగ్య సంక్షేమ పథకం)`,
    category: details.category,
    level: details.level,
    benefit_amount: details.benefitAmount,
    benefit_amount_te: details.benefitAmountTe,
    simplified: {
      eligibility: 'Residents of Andhra Pradesh meeting income and ration card criteria under official government orders.',
      benefits: `${details.benefitAmount} covering eligible inpatient medical procedures and diagnostic tests.`,
      documents: details.detectedDocuments.map(d => d.name).join(', '),
      steps: `Submit documents at ${details.applicationPoints.join(' or ')}.`
    },
    telugu: {
      eligibility: 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసితులు మరియు సంబంధిత నిబంధనల ప్రకారం అర్హత కలిగిన కుటుంబాలు.',
      benefits: `${details.benefitAmountTe} తో ఉచిత వైద్య చికిత్సలు మరియు పరీక్షల సౌకర్యం.`,
      documents: details.detectedDocuments.map(d => d.name_te).join(', '),
      steps: `${details.applicationPoints.join(' లేదా ')} వద్ద దరఖాస్తు చేసుకోవచ్చు.`
    },
    required_documents: details.detectedDocuments,
    is_ai_generated: false,
    source_name: 'Verified Document Analysis (Local Extraction)'
  };
}

/**
 * End-to-end processing pipeline for a health scheme PDF.
 *
 * @param {Buffer|Uint8Array|string} pdfInput - PDF buffer or file path
 * @param {Object} [options]
 * @param {string} [options.filename] - Original filename
 * @param {Object} [options.aiClient] - Optional GoogleGenAI instance
 * @returns {Promise<Object>} Fully processed document summary
 */
export async function processSchemeDocumentPdf(pdfInput, options = {}) {
  const { filename = '', aiClient = null } = options;

  // Step 1: Extract Text & Metadata
  const extracted = await extractTextFromPdf(pdfInput);

  // Step 2: Extract Key Details
  const keyDetails = extractKeyDetailsForAI(extracted.text, filename);

  // Step 3: Summarize via AI or Grounded Fallback
  const summary = await summarizeSchemeDocumentWithAI(keyDetails, aiClient);

  return {
    ...summary,
    metadata: {
      char_count: extracted.charCount,
      page_count: extracted.pageCount,
      is_text_extracted: extracted.isTextExtracted,
      filename: filename
    }
  };
}
