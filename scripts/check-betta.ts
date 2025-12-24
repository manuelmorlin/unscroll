/**
 * Script to check betta&manu account films
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BETTA_UID = 'PyIpCkd0IlO3uASpfLjabiJld762';

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

async function checkBettaFilms() {
  try {
    console.log('🎬 Checking betta&manu account films...\n');
    
    const userRef = db.collection('users').doc(BETTA_UID);
    
    // Check watchlist
    const watchlistSnapshot = await userRef.collection('watchlist').get();
    console.log(`📋 WATCHLIST (${watchlistSnapshot.docs.length} films):`);
    watchlistSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${data.title} (${data.year || 'N/A'}) - Status: ${data.status}`);
    });
    
    // Check diary
    const diarySnapshot = await userRef.collection('diary').get();
    console.log(`\n📔 DIARY (${diarySnapshot.docs.length} films):`);
    diarySnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${data.title} (${data.year || 'N/A'}) - Rating: ${data.user_rating || 'N/A'}⭐`);
    });
    
    console.log(`\n📊 Total: ${watchlistSnapshot.docs.length + diarySnapshot.docs.length} films`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkBettaFilms();
