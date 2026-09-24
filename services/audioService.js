/**
 * services/audioService.js
 * =============================================================================
 * SmartGov Health - Unified Backend TTS Audio Engine
 * =============================================================================
 * Provides high-fidelity Microsoft Edge Neural TTS audio generation for:
 *   - Telugu: te-IN-ShrutiNeural
 *   - English: en-IN-NeerjaNeural
 * 
 * Includes persistent disk caching with MD5 hashing and text sanitization.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.resolve(__dirname, '../public/audio');

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Clean and normalize text for spoken Telugu synthesis
 */
export function sanitizeTeluguSpeechText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
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
    .replace(/YSR\s*Kanti\s*Velugu|Kanti\s*Velugu/gi, 'కంటి వెలుగు')
    .replace(/YSR\s*Village\s*Clinic/gi, 'వైఎస్సార్ విలేజ్ క్లినిక్')
    .replace(/104\s*Mobile\s*Medical\s*Units?/gi, '104 మొబైల్ మెడికల్ యూనిట్')
    .replace(/108\s*Emergency\s*Ambulance/gi, '108 అత్యవసర అంబులెన్స్')
    .replace(/PHC/g, 'పీహెచ్‌సీ')
    .replace(/CHC/g, 'సీహెచ్‌సీ')
    .replace(/OPD/g, 'ఓపీడీ')
    .replace(/108/g, 'నూరు ఎనిమిది')
    .replace(/104/g, 'నూరు నాలుగు')
    .replace(/102/g, 'నూరు రెండు')
    .replace(/\bAP\b/g, 'ఆంధ్రప్రదేశ్')
    .replace(/Govt\.?|Government/gi, 'ప్రభుత్వ')
    .replace(/Thalassaemia/gi, 'తలసేమియా')
    .replace(/Haemophilia/gi, 'హీమోఫీలియా')
    .replace(/Dialysis/gi, 'డయాలసిస్')
    .replace(/Eligibility:?/gi, 'అర్హత వివరాలు:')
    .replace(/Benefits:?/gi, 'పథకం ప్రయోజనాలు:')
    .replace(/Documents:?/gi, 'కావలసిన పత్రాలు:')
    .replace(/Steps:?/gi, 'దరఖాస్తు విధానం:')
    // Replace remaining isolated Latin words if short or keep clean
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || rawText;
}

/**
 * Returns voice name and rate according to language.
 *
 * @param {string} lang - 'te' | 'en'
 * @param {boolean} [isSlow=false]
 * @returns {{ voice: string, locale: string, rate: string }}
 */
export function getVoiceConfig(lang = 'te', isSlow = false) {
  const normalizedLang = (lang === 'en' || lang === 'en-IN') ? 'en' : 'te';
  if (normalizedLang === 'en') {
    return {
      voice: 'en-IN-NeerjaNeural',
      locale: 'en-IN',
      rate: isSlow ? '-12%' : '-4%',
      lang: 'en'
    };
  }
  return {
    voice: 'te-IN-ShrutiNeural',
    locale: 'te-IN',
    rate: isSlow ? '-15%' : '-6%',
    lang: 'te'
  };
}

/**
 * Generates an MP3 audio buffer for given text and language using Edge TTS.
 * Reuses disk cache based on MD5(voice + rate + text).
 *
 * @param {string} text - Text to synthesize
 * @param {string} [lang='te'] - 'te' or 'en'
 * @param {Object} [options={}]
 * @param {boolean} [options.slow=false]
 * @param {string} [options.customVoice]
 * @returns {Promise<{ buffer: Buffer, cached: boolean, filePath: string, voice: string, lang: string }>}
 */
export async function generate_text_audio(text, lang = 'te', options = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text parameter is required for TTS synthesis.');
  }

  const cleanInput = text.trim();
  const config = getVoiceConfig(lang, options.slow);
  const voice = options.customVoice || config.voice;
  const rate = config.rate;
  const isEn = config.lang === 'en';

  const textToSpeak = isEn ? cleanInput : sanitizeTeluguSpeechText(cleanInput);
  const truncatedText = textToSpeak.slice(0, 1500);

  const hash = crypto.createHash('md5').update(`${voice}:${rate}:${truncatedText}`).digest('hex');
  const cachedFilePath = path.join(AUDIO_DIR, `tts_${hash}.mp3`);

  if (fs.existsSync(cachedFilePath)) {
    const buffer = fs.readFileSync(cachedFilePath);
    return {
      buffer,
      cached: true,
      filePath: cachedFilePath,
      voice,
      lang: config.lang
    };
  }

  const { EdgeTTS } = await import('@andresaya/edge-tts');
  const tts = new EdgeTTS({ voice, lang: config.locale, rate });
  await tts.synthesize(truncatedText, voice, { rate });
  const buffer = await tts.toBuffer();

  // Cache buffer to disk
  try {
    fs.writeFileSync(cachedFilePath, buffer);
  } catch (writeErr) {
    console.warn('[audioService] Cache write warning:', writeErr.message);
  }

  return {
    buffer,
    cached: false,
    filePath: cachedFilePath,
    voice,
    lang: config.lang
  };
}
