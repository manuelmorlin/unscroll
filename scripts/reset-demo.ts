/**
 * Script to reset database and create demo user with sample data
 * Run with: npx tsx scripts/reset-demo.ts
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

// Sample movies with varied data
const sampleMovies = [
  {
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi, Thriller',
    duration: '2h 28m',
    plot: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
    cast: 'Leonardo DiCaprio, Marion Cotillard, Tom Hardy',
    status: 'watched',
    user_rating: 5,
    user_review: 'Mind-bending masterpiece! The layers of dreams within dreams kept me on the edge of my seat.',
    watched_at: new Date('2025-12-15').toISOString(),
  },
  {
    title: 'The Shawshank Redemption',
    year: 1994,
    genre: 'Drama',
    duration: '2h 22m',
    plot: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    cast: 'Tim Robbins, Morgan Freeman',
    status: 'watched',
    user_rating: 5,
    user_review: 'A timeless classic. The ending still gives me chills every time.',
    watched_at: new Date('2025-12-10').toISOString(),
  },
  {
    title: 'Parasite',
    year: 2019,
    genre: 'Thriller, Drama',
    duration: '2h 12m',
    plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    cast: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong',
    status: 'watched',
    user_rating: 4,
    user_review: 'Brilliant social commentary wrapped in a thrilling package.',
    watched_at: new Date('2025-11-28').toISOString(),
  },
  {
    title: 'Interstellar',
    year: 2014,
    genre: 'Sci-Fi, Adventure',
    duration: '2h 49m',
    plot: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    status: 'watching',
    user_rating: null,
    user_review: null,
    watched_at: null,
  },
  {
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action, Crime, Drama',
    duration: '2h 32m',
    plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
    cast: 'Christian Bale, Heath Ledger, Aaron Eckhart',
    status: 'unwatched',
    user_rating: null,
    user_review: null,
    watched_at: null,
  },
  {
    title: 'Pulp Fiction',
    year: 1994,
    genre: 'Crime, Drama',
    duration: '2h 34m',
    plot: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    cast: 'John Travolta, Uma Thurman, Samuel L. Jackson',
    status: 'unwatched',
    user_rating: null,
    user_review: null,
    watched_at: null,
  },
  {
    title: 'Spirited Away',
    year: 2001,
    genre: 'Animation, Adventure, Family',
    duration: '2h 5m',
    plot: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
    cast: 'Daveigh Chase, Suzanne Pleshette, Miyu Irino',
    status: 'watched',
    user_rating: 5,
    user_review: 'Pure magic. Miyazaki at his finest.',
    watched_at: new Date('2025-11-15').toISOString(),
  },
  {
    title: 'The Godfather',
    year: 1972,
    genre: 'Crime, Drama',
    duration: '2h 55m',
    plot: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.',
    cast: 'Marlon Brando, Al Pacino, James Caan',
    status: 'unwatched',
    user_rating: null,
    user_review: null,
    watched_at: null,
  },
  {
    title: 'Get Out',
    year: 2017,
    genre: 'Horror, Mystery, Thriller',
    duration: '1h 44m',
    plot: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.',
    cast: 'Daniel Kaluuya, Allison Williams, Bradley Whitford',
    status: 'watched',
    user_rating: 4,
    user_review: 'Jordan Peele redefined horror. So unsettling and smart.',
    watched_at: new Date('2025-10-31').toISOString(),
  },
  {
    title: 'Dune',
    year: 2021,
    genre: 'Sci-Fi, Adventure',
    duration: '2h 35m',
    plot: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset while its heir becomes troubled by visions of a dark future.',
    cast: 'Timothée Chalamet, Rebecca Ferguson, Zendaya',
    status: 'watching',
    user_rating: null,
    user_review: null,
    watched_at: null,
  },
];

async function deleteAllUsers() {
  console.log('🗑️  Deleting all users...');
  
  const listResult = await auth.listUsers(1000);
  const deletePromises = listResult.users.map(user => auth.deleteUser(user.uid));
  await Promise.all(deletePromises);
  
  console.log(`   Deleted ${listResult.users.length} users from Auth`);
}

async function deleteAllMediaItems() {
  console.log('🗑️  Deleting all media items...');
  
  const snapshot = await db.collection('media_items').get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(`   Deleted ${snapshot.size} media items from Firestore`);
}

async function deleteAllUserProfiles() {
  console.log('🗑️  Deleting all user profiles...');
  
  const snapshot = await db.collection('users').get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(`   Deleted ${snapshot.size} user profiles from Firestore`);
}

async function createDemoUser() {
  console.log('👤 Creating demo user...');
  
  const demoPassword = process.env.DEMO_USER_PASSWORD;
  if (!demoPassword) {
    throw new Error('DEMO_USER_PASSWORD environment variable is required');
  }
  
  // Create user in Firebase Auth
  const demoUser = await auth.createUser({
    email: 'demo@unscroll.app',
    password: demoPassword,
    displayName: 'demo',
    emailVerified: true,
  });
  
  console.log(`   Created user: ${demoUser.uid}`);
  
  // Create user profile in Firestore
  await db.collection('users').doc(demoUser.uid).set({
    id: demoUser.uid,
    email: 'demo@unscroll.app',
    username: 'demo',
    isDemo: true,
    createdAt: new Date().toISOString(),
  });
  
  console.log('   Created user profile in Firestore');
  
  return demoUser.uid;
}

async function populateMediaItems(userId: string) {
  console.log('🎬 Adding sample movies...');
  
  const now = new Date().toISOString();
  
  for (const movie of sampleMovies) {
    const docRef = db.collection('media_items').doc();
    await docRef.set({
      id: docRef.id,
      user_id: userId,
      title: movie.title,
      year: movie.year,
      genre: movie.genre,
      duration: movie.duration,
      plot: movie.plot,
      cast: movie.cast,
      format: 'movie',
      status: movie.status,
      rating: null,
      user_rating: movie.user_rating,
      user_review: movie.user_review,
      watched_at: movie.watched_at,
      poster_url: null,
      created_at: now,
      updated_at: now,
    });
    console.log(`   ✓ Added: ${movie.title}`);
  }
  
  console.log(`   Total: ${sampleMovies.length} movies added`);
}

async function main() {
  console.log('\n🎬 UNSCROLL - Database Reset Script\n');
  console.log('====================================\n');
  
  try {
    // Step 1: Delete everything
    await deleteAllMediaItems();
    await deleteAllUserProfiles();
    await deleteAllUsers();
    
    console.log('');
    
    // Step 2: Create demo user and populate data
    const demoUserId = await createDemoUser();
    await populateMediaItems(demoUserId);
    
    console.log('\n====================================');
    console.log('✅ Database reset complete!\n');
    console.log('Demo credentials:');
    console.log('  Email: demo@unscroll.app');
    console.log('  Password: (see DEMO_USER_PASSWORD env var)');
    console.log('  Username: demo\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
