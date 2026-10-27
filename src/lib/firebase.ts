import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  where,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress internal Firestore connection warnings in headless / restricted environments
try {
  setLogLevel('error');
} catch {
  // Ignore in case environment restricts log level
}

// Suppress Firestore 10-second backend connection warning in console
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function (...args: any[]) {
    if (args.some(arg => typeof arg === 'string' && arg.includes('Could not reach Cloud Firestore backend'))) {
      return;
    }
    return originalWarn.apply(console, args);
  };
  const originalError = console.error;
  console.error = function (...args: any[]) {
    if (args.some(arg => typeof arg === 'string' && arg.includes('Could not reach Cloud Firestore backend'))) {
      return;
    }
    return originalError.apply(console, args);
  };
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firestore client operating in offline mode.");
    }
  }
}

// Fire non-blocking connection check
testConnection();

