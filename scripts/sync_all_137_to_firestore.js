import { writeSchemePatch } from '../services/schemeCatalog.js';
import { connectServerFirestore } from '../services/serverFirestore.js';
import { doc, runTransaction, terminate } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../data/national_and_ap_schemes.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

console.log(`Loaded ${Object.keys(catalogData).length} unique schemes for Firestore sync.`);

async function syncToFirestore() {
  try {
    const configPath = path.join(__dirname, '../firebase-applet-config.json');
    const db = await connectServerFirestore(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    if (!db) throw new Error('Configure an authorized Firestore service login first.');

    let count = 0;

    for (const [sName, sData] of Object.entries(catalogData)) {
      const docId = sName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '_');
      const docRef = doc(db, 'schemes', docId);

      const payload = {
        name: sName,
        scheme_name: sName,
        required_documents: sData.required_documents || [],
        level: sData.level || 'National',
        category: sData.category || 'Health Care',
        telugu_name: sData.telugu_name || sName,
        official_website: sData.official_website || sData.source_url || 'https://india.gov.in/',
        source_name: sData.source_name || 'Government Portal',
        source_url: sData.source_url || 'https://india.gov.in/',
        keywords: sData.keywords || [sName],
        simplified: sData.simplified || {},
        telugu: sData.telugu || {},
        description: sData.description || sName,
        telugu_description: sData.telugu_description || sName,
        updated_at: new Date().toISOString()
      };

      await writeSchemePatch(docRef, payload, callback => runTransaction(db, callback));
      count++;
    }

    await terminate(db);
    console.log(`Successfully synced all ${count} schemes to Firestore collection '/schemes'!`);
  } catch (err) {
    console.error('Firestore sync error:', err.message);
    process.exit(1);
  }
}

syncToFirestore();
