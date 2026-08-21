import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const configContent = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configContent);

const app = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId
});
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    await db.collection('requests').limit(1).get();
    console.log("SUCCESS");
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
