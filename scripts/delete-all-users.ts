/**
 * Script to delete all Firebase Auth users and their Firestore data
 * Run with: npx tsx scripts/delete-all-users.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function deleteAllUsers() {
  console.log('🗑️  Starting user deletion...\n');

  try {
    // Get all users
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;

    if (users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    for (const user of users) {
      console.log(`- ${user.email} (${user.uid})`);
    }

    console.log('\n⏳ Deleting users and their data...\n');

    // Delete each user and their Firestore data
    for (const user of users) {
      // Delete user's media items
      const mediaSnapshot = await db
        .collection('media_items')
        .where('user_id', '==', user.uid)
        .get();

      const batch = db.batch();
      mediaSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`  ✓ Deleted ${mediaSnapshot.size} media items for ${user.email}`);

      // Delete user document
      await db.collection('users').doc(user.uid).delete();
      console.log(`  ✓ Deleted user document for ${user.email}`);

      // Delete Firebase Auth user
      await auth.deleteUser(user.uid);
      console.log(`  ✓ Deleted auth account for ${user.email}\n`);
    }

    console.log('✅ All users deleted successfully!');
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

deleteAllUsers().then(() => process.exit(0));
