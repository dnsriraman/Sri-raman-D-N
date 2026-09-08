import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FirestoreErrorInfo, OperationType } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Hardened error handler required by Firebase Integration Skill
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo: current?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('[Firestore Error]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper using getDocFromServer
export async function testFirestoreConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const testRef = doc(db, 'test', 'connection');
    // Ensure test doc exists for latency verification
    await setDoc(testRef, { lastPing: new Date().toISOString(), client: 'web' }, { merge: true });
    await getDocFromServer(testRef);
    const latency = Math.round(performance.now() - start);
    return { success: true, latencyMs: latency };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.warn('Firestore client appears to be offline. Verify network connection.');
    }
    return { success: false, latencyMs: latency, error: msg };
  }
}
