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
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    let app;
    if (getApps().length === 0) {
      app = initializeApp();
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);
    const collectionRef = db.collection('schemes');

    let count = 0;
    const batchSize = 40;
    let batch = db.batch();

    for (const [sName, sData] of Object.entries(catalogData)) {
      const docId = sName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '_');
      const docRef = collectionRef.doc(docId);

      const payload = {
        name: sName,
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

      batch.set(docRef, payload, { merge: true });
      count++;

      if (count % batchSize === 0) {
        await batch.commit();
        batch = db.batch();
        console.log(`Committed batch up to ${count} schemes.`);
      }
    }

    if (count % batchSize !== 0) {
      await batch.commit();
    }

    console.log(`Successfully synced all ${count} schemes to Firestore collection '/schemes'!`);
  } catch (err) {
    console.error('Firestore sync error:', err.message);
    process.exit(1);
  }
}

syncToFirestore();
