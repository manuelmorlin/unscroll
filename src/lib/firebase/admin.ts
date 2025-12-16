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
  if (!key) return undefined;
  
  // If key contains literal \n, replace with actual newlines
  // If key already has actual newlines (from Vercel), use as-is
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
};

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: getPrivateKey(),
};

// Initialize Firebase Admin (singleton pattern)
const adminApp = getApps().length > 0 
  ? getApps()[0] 
  : initializeApp({
      credential: cert(serviceAccount),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export default adminApp;
