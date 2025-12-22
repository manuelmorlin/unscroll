import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

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

const adminApp = getApps().length > 0 
  ? getApps()[0] 
  : initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(adminApp);

async function listUsers() {
  const usersSnapshot = await db.collection('users').get();
  console.log('Utenti registrati in Firestore:');
  console.log('================================');
  usersSnapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`${i+1}. Username: ${data.username || 'N/A'}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   UID: ${doc.id}`);
    const createdAt = data.createdAt?._seconds 
      ? new Date(data.createdAt._seconds * 1000).toLocaleString('it-IT')
      : (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('it-IT') : 'N/A');
    console.log(`   Creato: ${createdAt}`);
    console.log('');
  });
  console.log(`Totale: ${usersSnapshot.size} utenti`);
}

listUsers().catch(console.error);
