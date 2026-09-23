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
const SCHEMES_FILE = path.join(ROOT_DIR, 'data', 'scraped_ap_schemes.json');

async function syncSchemes() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('[-] firebase-applet-config.json not found, skipping Firestore sync.');
    return;
  }
  if (!fs.existsSync(SCHEMES_FILE)) {
    console.log('[-] data/scraped_ap_schemes.json not found, nothing to sync.');
    return;
  }

  const schemes = JSON.parse(fs.readFileSync(SCHEMES_FILE, 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

  console.log(`[*] Connecting to Firestore database: ${cfg.firestoreDatabaseId || '(default)'}`);
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, doc, setDoc, terminate } = await import('firebase/firestore');

  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId || '(default)');

  let synced = 0;
  for (const [name, data] of Object.entries(schemes)) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-|-$/g, '');
    const docRef = doc(db, 'schemes', slug);
    await setDoc(docRef, {
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
    }, { merge: true });
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
