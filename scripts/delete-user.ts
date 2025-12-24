/**
 * Script to delete a user by email
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const EMAIL_TO_DELETE = 'manuel.morlin2002@gmail.com';

const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
};

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: getPrivateKey(),
};

const app = initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function deleteUser() {
  try {
    console.log(`Looking for user with email: ${EMAIL_TO_DELETE}`);
    
    const usersSnapshot = await db.collection('users').where('email', '==', EMAIL_TO_DELETE).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found in Firestore with that email');
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const uid = userDoc.id;
    console.log(`Found user in Firestore: ${uid}`);
    
    console.log('Deleting Firestore data...');
    const userRef = db.collection('users').doc(uid);
    
    const subcollections = ['watchlist', 'diary'];
    for (const subcol of subcollections) {
      const snapshot = await userRef.collection(subcol).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`  Deleted ${snapshot.docs.length} docs from ${subcol}`);
      }
    }
    
    await userRef.delete();
    console.log('  Deleted user document');
    
    try {
      await auth.deleteUser(uid);
      console.log('✅ User deleted from Firebase Auth');
    } catch {
      console.log('⚠️  User not found in Firebase Auth (only in Firestore)');
    }
    
    console.log(`\n🗑️  Successfully deleted user: ${EMAIL_TO_DELETE}`);
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

deleteUser();
