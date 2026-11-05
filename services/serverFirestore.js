import { getApps, initializeApp } from 'firebase/app';
import { getAuth, getIdTokenResult, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const appName = 'smartgov-server';
let connection;

export function connectServerFirestore(config, env = process.env) {
  if (!config?.projectId || !env.FIRESTORE_SERVICE_EMAIL || !env.FIRESTORE_SERVICE_PASSWORD) {
    return Promise.resolve(null);
  }
  const apiKey = env.FIREBASE_WEB_API_KEY?.trim() || config.apiKey;
  if (!apiKey) {
    console.warn('Firestore service login needs FIREBASE_WEB_API_KEY.');
    return Promise.resolve(null);
  }
  connection ??= signIn({ ...config, apiKey }, env);
  return connection;
}

async function signIn(config, env) {
  try {
    const app = getApps().find(item => item.name === appName) || initializeApp(config, appName);
    const auth = getAuth(app);
    const { user } = await signInWithEmailAndPassword(auth, env.FIRESTORE_SERVICE_EMAIL, env.FIRESTORE_SERVICE_PASSWORD);
    if ((await getIdTokenResult(user)).claims.admin !== true) {
      await signOut(auth);
      console.warn('Firestore service account needs the Firebase Auth admin claim.');
      return null;
    }
    return getFirestore(app, config.firestoreDatabaseId || '(default)');
  } catch (error) {
    console.warn('Firestore service login failed:', error.code || error.name);
    return null;
  }
}
