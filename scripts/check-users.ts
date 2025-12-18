import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

const db = getFirestore(app);
const auth = getAuth(app);

async function check() {
  // Check demo user
  try {
    const demoUser = await auth.getUserByEmail('demo@unscroll.app');
    const demoMovies = await db.collection('users').doc(demoUser.uid).collection('mediaItems').get();
    console.log('Demo user:', demoUser.uid, '- Movies:', demoMovies.size);
  } catch {
    console.log('Demo user not found');
  }

  // Check betta&manu
  try {
    const bettaUser = await auth.getUserByEmail('betta-luna@hotmail.it');
    const bettaMovies = await db.collection('users').doc(bettaUser.uid).collection('mediaItems').get();
    console.log('Betta&manu:', bettaUser.uid, '- Movies:', bettaMovies.size);
    if (bettaMovies.size > 0) {
      console.log('First movie:', bettaMovies.docs[0].data().title);
    }
  } catch {
    console.log('Betta user not found');
  }
}

check().then(() => process.exit(0));
