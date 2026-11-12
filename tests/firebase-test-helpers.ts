import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// Local-only Firebase project ID for emulator-based QA tests.
// Deliberately NOT the production project ID; production services are never touched.
export const LOCAL_PROJECT_ID = 'demo-keedohub';

// Named Firestore database ID (preserved from production config for emulator routing).
export const FIRESTORE_DATABASE_ID = 'ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38';

export const LOCAL_EMULATOR_HOST = '127.0.0.1';

// Force Firebase SDK into emulator mode and prevent accidental production connections.
process.env.GCLOUD_PROJECT = LOCAL_PROJECT_ID;
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: LOCAL_PROJECT_ID,
  storageBucket: `${LOCAL_PROJECT_ID}.appspot.com`,
});
process.env.FIRESTORE_EMULATOR_HOST = `${LOCAL_EMULATOR_HOST}:8080`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${LOCAL_EMULATOR_HOST}:9099`;
process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${LOCAL_EMULATOR_HOST}:9199`;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

const adminApp = initializeAdminApp({ projectId: LOCAL_PROJECT_ID }, `test-admin-${Date.now()}`);
export const adminDb = getAdminFirestore(adminApp, FIRESTORE_DATABASE_ID);

export interface LocalClient {
  uid?: string;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  close: () => Promise<void>;
}

async function createLocalClient(label: string, authenticate: boolean): Promise<LocalClient> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const projectApp = initializeApp({
    apiKey: 'local-emulator-test-key',
    authDomain: `${LOCAL_PROJECT_ID}.firebaseapp.com`,
    projectId: LOCAL_PROJECT_ID,
    storageBucket: `${LOCAL_PROJECT_ID}.appspot.com`,
  }, `test-${label}-${suffix}`);
  const auth = getAuth(projectApp);
  connectAuthEmulator(auth, `http://${LOCAL_EMULATOR_HOST}:9099`, { disableWarnings: true });
  let uid: string | undefined;
  if (authenticate) {
    const user = await createUserWithEmailAndPassword(
      auth,
      `${label}-${suffix}@example.test`,
      'local-test-password',
    );
    uid = user.user.uid;
  }
  const db = getFirestore(projectApp, FIRESTORE_DATABASE_ID);
  connectFirestoreEmulator(db, LOCAL_EMULATOR_HOST, 8080);
  const storage = getStorage(projectApp, `gs://${LOCAL_PROJECT_ID}.appspot.com`);
  connectStorageEmulator(storage, LOCAL_EMULATOR_HOST, 9199);
  return {
    uid,
    db,
    storage,
    close: async () => {
      await signOut(auth);
      await deleteApp(projectApp);
    },
  };
}

export function createLocalUser(label: string): Promise<LocalClient & { uid: string }> {
  return createLocalClient(label, true) as Promise<LocalClient & { uid: string }>;
}

export function createUnauthenticatedClient(): Promise<LocalClient> {
  return createLocalClient('unauthenticated', false);
}