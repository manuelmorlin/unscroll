/**
 * Firebase Admin SDK
 * Server-side Firebase initialization for Server Actions
 */

import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Handle private key - Vercel stores it with literal \n or actual newlines
const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    console.error('[Firebase Admin] FIREBASE_PRIVATE_KEY is not set');
    return undefined;
  }
  
  // Log key info for debugging (safe - no actual key content)
  console.log('[Firebase Admin] Key starts with:', key.substring(0, 30));
  console.log('[Firebase Admin] Key length:', key.length);
  console.log('[Firebase Admin] Has literal \\n:', key.includes('\\n'));
  console.log('[Firebase Admin] Has actual newlines:', key.includes('\n'));
  
  // If key contains literal \n, replace with actual newlines
  // If key already has actual newlines (from Vercel), use as-is
  const processedKey = key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
  
  console.log('[Firebase Admin] Processed key starts with:', processedKey.substring(0, 30));
  
  return processedKey;
};

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

console.log('[Firebase Admin] Project ID:', projectId);
console.log('[Firebase Admin] Client Email:', clientEmail);

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey: getPrivateKey(),
};

// Initialize Firebase Admin (singleton pattern)
let adminApp;
try {
  adminApp = getApps().length > 0 
    ? getApps()[0] 
    : initializeApp({
        credential: cert(serviceAccount),
      });
  console.log('[Firebase Admin] App initialized successfully');
} catch (error) {
  console.error('[Firebase Admin] Init error:', error);
  throw error;
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export default adminApp;
