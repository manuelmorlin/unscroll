/**
 * Script to fix rewatch_count for films that have been watched only once
 * but incorrectly have rewatch_count > 0
 * 
 * Run with: npx tsx scripts/fix-rewatch-count.ts
 */

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

async function fixRewatchCount() {
  console.log('🔍 Checking for films with incorrect rewatch_count...\n');

  const snapshot = await db.collection('media_items').get();
  
  let fixedCount = 0;
  let checkedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    checkedCount++;
    
    const rewatchCount = data.rewatch_count || 0;
    const rewatchDates = data.rewatch_dates || [];
    
    // If rewatch_count doesn't match the actual number of rewatch dates, fix it
    if (rewatchCount !== rewatchDates.length) {
      console.log(`📝 Fixing "${data.title}":`);
      console.log(`   - rewatch_count was: ${rewatchCount}`);
      console.log(`   - rewatch_dates length: ${rewatchDates.length}`);
      console.log(`   - Setting rewatch_count to: ${rewatchDates.length}`);
      
      await doc.ref.update({
        rewatch_count: rewatchDates.length,
      });
      
      fixedCount++;
    }
  }

  console.log(`\n✅ Done! Checked ${checkedCount} films, fixed ${fixedCount} records.`);
}

fixRewatchCount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
