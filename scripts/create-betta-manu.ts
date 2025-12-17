/**
 * Script to create betta&manu user with their watchlist
 * Run with: npx tsx scripts/create-betta-manu.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
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

const auth = getAuth(app);
const db = getFirestore(app);

// Movies to add (all unwatched)
const movies = [
  { title: 'Bugonia', year: 2025, genre: 'Sci-Fi, Comedy', duration: '1h 34m' },
  { title: 'Parasite', year: 2019, genre: 'Thriller, Drama', duration: '2h 12m' },
  { title: 'The Imitation Game', year: 2014, genre: 'Biography, Drama', duration: '1h 54m' },
  { title: 'Coco', year: 2017, genre: 'Animation, Family', duration: '1h 45m' },
  { title: 'Il Pianista', year: 2002, genre: 'Biography, Drama', duration: '2h 30m' },
  { title: 'The Lobster', year: 2015, genre: 'Drama, Romance, Sci-Fi', duration: '1h 59m' },
  { title: 'Notting Hill', year: 1999, genre: 'Comedy, Romance', duration: '2h 4m' },
  { title: 'Your Name', year: 2016, genre: 'Animation, Romance, Fantasy', duration: '1h 46m' },
  { title: 'The Great Gatsby', year: 2013, genre: 'Drama, Romance', duration: '2h 23m' },
  { title: 'Me Before You', year: 2016, genre: 'Drama, Romance', duration: '1h 50m' },
  { title: 'Rent', year: 2005, genre: 'Drama, Musical', duration: '2h 15m' },
  { title: 'Hamilton', year: 2020, genre: 'Biography, Drama, Musical', duration: '2h 40m' },
  { title: 'Il Codice Da Vinci', year: 2006, genre: 'Mystery, Thriller', duration: '2h 29m' },
  { title: 'Giuseppe il Re dei Sogni', year: 2000, genre: 'Animation, Family, Musical', duration: '1h 15m' },
];

async function createUser() {
  console.log('👤 Creating betta&manu user...');
  
  // Create user in Firebase Auth
  const user = await auth.createUser({
    email: 'betta-luna@hotmail.it',
    password: '03082023',
    displayName: 'betta&manu',
    emailVerified: true,
  });
  
  console.log(`   Created user: ${user.uid}`);
  
  // Create user profile in Firestore
  await db.collection('users').doc(user.uid).set({
    id: user.uid,
    email: 'betta-luna@hotmail.it',
    username: 'betta&manu',
    isDemo: false,
    createdAt: new Date().toISOString(),
  });
  
  console.log('   Created user profile in Firestore');
  
  return user.uid;
}

async function populateMovies(userId: string) {
  console.log('🎬 Adding movies to watchlist...');
  
  const now = new Date().toISOString();
  
  for (const movie of movies) {
    const docRef = db.collection('media_items').doc();
    await docRef.set({
      id: docRef.id,
      user_id: userId,
      title: movie.title,
      year: movie.year,
      genre: movie.genre,
      duration: movie.duration,
      plot: null,
      cast: null,
      format: 'movie',
      status: 'unwatched',
      rating: null,
      user_rating: null,
      user_review: null,
      watched_at: null,
      poster_url: null,
      created_at: now,
      updated_at: now,
    });
    console.log(`   ✓ Added: ${movie.title}`);
  }
  
  console.log(`   Total: ${movies.length} movies added`);
}

async function main() {
  console.log('\n🎬 UNSCROLL - Create User Script\n');
  console.log('====================================\n');
  
  try {
    const userId = await createUser();
    await populateMovies(userId);
    
    console.log('\n====================================');
    console.log('✅ User created successfully!\n');
    console.log('Credentials:');
    console.log('  Email: betta-luna@hotmail.it');
    console.log('  Password: 03082023');
    console.log('  Username: betta&manu\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
