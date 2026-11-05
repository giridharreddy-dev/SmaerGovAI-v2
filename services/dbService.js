import fs from 'fs';
import path from 'path';
import { connectServerFirestore } from './serverFirestore.js';

let firebaseConfig = {};
try {
  const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) {
  console.log("Firebase config not found.");
}

const dbAdmin = await connectServerFirestore(firebaseConfig);

export { dbAdmin, firebaseConfig };
