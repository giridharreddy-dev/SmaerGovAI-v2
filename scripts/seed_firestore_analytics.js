import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
const firebaseConfig = JSON.parse(configContent);

const app = initializeApp(firebaseConfig);
const dbAdmin = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const dummyRaw = fs.readFileSync(path.resolve('./data/dummy_feedback.json'), 'utf8');
const dummyData = JSON.parse(dummyRaw);

async function seed() {
  console.log('--- Seeding Firestore for user analytics ---');

  // 1. Seed feedback (reviews)
  console.log(`Seeding ${dummyData.feedback.length} citizen reviews...`);
  for (const fb of dummyData.feedback) {
    await setDoc(doc(dbAdmin, 'feedback', fb.id), fb);
  }

  // 2. Seed staff grievances
  console.log(`Seeding ${dummyData.staffFeedback.length} reported issues...`);
  for (const st of dummyData.staffFeedback) {
    await setDoc(doc(dbAdmin, 'staffFeedback', st.id), st);
  }

  // 3. Seed WhatsApp shares (52 shares)
  console.log('Seeding 52 WhatsApp shares...');
  for (let i = 1; i <= 52; i++) {
    const id = `share-${String(i).padStart(3, '0')}`;
    const schemeName = dummyData.feedback[i % dummyData.feedback.length].scheme_name;
    const shareDoc = {
      id,
      scheme_name: schemeName,
      platform: 'whatsapp',
      timestamp: new Date(Date.now() - (i * 3600000 * 4)).toISOString()
    };
    await setDoc(doc(dbAdmin, 'whatsappShares', id), shareDoc);
  }

  // 4. Seed Requests / Views & Searches (285 total requests)
  console.log('Seeding 285 Views & Searches (requests)...');
  const sources = ['portal_search', 'web_card_click', 'voice_telugu_query', 'qr_scan', 'share_link'];
  for (let i = 1; i <= 285; i++) {
    const id = `req-seed-${String(i).padStart(4, '0')}`;
    const schemeName = dummyData.feedback[i % dummyData.feedback.length].scheme_name;
    const reqDoc = {
      id,
      scheme_name: schemeName,
      source: sources[i % sources.length],
      timestamp: new Date(Date.now() - (i * 1800000 * 2)).toISOString()
    };
    await setDoc(doc(dbAdmin, 'requests', id), reqDoc);
  }

  console.log('✅ Successfully seeded Firestore with reviews, issues, shares, and views!');
}

seed().catch(err => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
