import re

with open('server.js', 'r') as f:
    content = f.read()

# Replace imports and init
old_init = """import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseConfig = {};
try {
  const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) {
  console.log("Firebase config not found.");
}

let dbAdmin = null;
if (firebaseConfig.projectId && admin.apps.length === 0) {
  const app = admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  dbAdmin = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
}"""

new_init = """import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseConfig = {};
try {
  const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) {
  console.log("Firebase config not found.");
}

let dbAdmin = null;
if (firebaseConfig.projectId && getApps().length === 0) {
  const app = initializeApp({
    projectId: firebaseConfig.projectId
  });
  dbAdmin = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
} else if (getApps().length > 0) {
  dbAdmin = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId || '(default)');
}"""

content = content.replace(old_init, new_init)

with open('server.js', 'w') as f:
    f.write(content)
