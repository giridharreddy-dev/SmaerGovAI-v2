/**
 * scripts/sync_firestore_schemes.cjs
 * =============================================================================
 * Synchronizes local scheme catalog from data/scraped_ap_schemes.json into
 * the project's cloud Firestore database under the /schemes collection.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT_DIR, 'firebase-applet-config.json');
const SCHEMES_FILE = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT_DIR, 'data', 'scraped_ap_schemes.json');

async function syncSchemes() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('[-] firebase-applet-config.json not found, skipping Firestore sync.');
    return;
  }
  if (!fs.existsSync(SCHEMES_FILE)) {
    throw new Error('Scheme input JSON file not found.');
  }

  const schemes = JSON.parse(fs.readFileSync(SCHEMES_FILE, 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

  console.log(`[*] Connecting to Firestore database: ${cfg.firestoreDatabaseId || '(default)'}`);
  const { connectServerFirestore } = await import('../services/serverFirestore.js');
  const { doc, runTransaction, terminate } = await import('firebase/firestore');
  const { writeSchemePatch } = await import('../services/schemeCatalog.js');

  const db = await connectServerFirestore(cfg);
  if (!db) throw new Error('Configure an authorized Firestore service login first.');

  let synced = 0;
  for (const [name, data] of Object.entries(schemes)) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-|-$/g, '');
    const docRef = doc(db, 'schemes', slug);
    await writeSchemePatch(docRef, {
      id: slug,
      scheme_name: name,
      telugu_name: data.telugu_name || name,
      level: data.level || 'Andhra Pradesh',
      category: data.category || 'Healthcare',
      benefit_amount: data.benefit_amount || '',
      benefit_amount_te: data.benefit_amount_te || '',
      source_name: data.source_name || '',
      source_url: data.source_url || '',
      simplified: data.simplified || {},
      telugu: data.telugu || {},
      required_documents: data.required_documents || [],
      eligibility_questions: data.eligibility_questions || [],
      key_treatments: data.key_treatments || [],
      key_treatments_te: data.key_treatments_te || [],
      updated_at: new Date().toISOString()
    }, callback => runTransaction(db, callback));
    synced++;
  }

  console.log(`[✓] Successfully synced ${synced} schemes to Firestore (/schemes collection).`);
  await terminate(db);
  process.exit(0);
}

syncSchemes().catch((err) => {
  console.error('[-] Firestore sync failed:', err.message);
  process.exit(1);
});
