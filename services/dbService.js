import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

export { dbAdmin, firebaseConfig };
