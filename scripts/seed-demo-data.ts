/**
 * Script to seed the demo account with sample movies
 * Run with: npx tsx scripts/seed-demo-data.ts
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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Sample movies data
const sampleMovies = [
  // Unwatched (red)
  {
    title: 'Dune: Part Two',
    genre: 'Science Fiction, Adventure',
    plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Josh Brolin',
    duration: '2h 46m',
    year: 2024,
    status: 'unwatched',
  },
  {
    title: 'Oppenheimer',
    genre: 'Biography, Drama, History',
    plot: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    cast: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
    duration: '3h 0m',
    year: 2023,
    status: 'unwatched',
  },
  {
    title: 'The Batman',
    genre: 'Action, Crime, Drama',
    plot: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.',
    cast: 'Robert Pattinson, Zoë Kravitz, Jeffrey Wright, Colin Farrell',
    duration: '2h 56m',
    year: 2022,
    status: 'unwatched',
  },
  {
    title: 'Poor Things',
    genre: 'Comedy, Drama, Romance',
    plot: 'The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.',
    cast: 'Emma Stone, Mark Ruffalo, Willem Dafoe, Ramy Youssef',
    duration: '2h 21m',
    year: 2023,
    status: 'unwatched',
  },
  
  // Watching (yellow)
  {
    title: 'Killers of the Flower Moon',
    genre: 'Crime, Drama, History',
    plot: 'Members of the Osage tribe in the United States are murdered under mysterious circumstances in the 1920s.',
    cast: 'Leonardo DiCaprio, Robert De Niro, Lily Gladstone, Jesse Plemons',
    duration: '3h 26m',
    year: 2023,
    status: 'watching',
  },
  {
    title: 'The Holdovers',
    genre: 'Comedy, Drama',
    plot: 'A cranky history teacher at a remote prep school is forced to remain on campus over the holidays with a student who has no place to go.',
    cast: 'Paul Giamatti, Da\'Vine Joy Randolph, Dominic Sessa',
    duration: '2h 13m',
    year: 2023,
    status: 'watching',
  },
  
  // Watched (green)
  {
    title: 'Everything Everywhere All at Once',
    genre: 'Action, Adventure, Comedy',
    plot: 'A middle-aged Chinese immigrant is swept up in an insane adventure where she alone can save existence by exploring other universes.',
    cast: 'Michelle Yeoh, Stephanie Hsu, Ke Huy Quan, Jamie Lee Curtis',
    duration: '2h 19m',
    year: 2022,
    status: 'watched',
  },
  {
    title: 'Parasite',
    genre: 'Drama, Thriller',
    plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    cast: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik',
    duration: '2h 12m',
    year: 2019,
    status: 'watched',
  },
  {
    title: 'Inception',
    genre: 'Action, Adventure, Sci-Fi',
    plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
    cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
    duration: '2h 28m',
    year: 2010,
    status: 'watched',
  },
  {
    title: 'The Shawshank Redemption',
    genre: 'Drama',
    plot: 'Over the course of several years, two convicts form a friendship, seeking consolation and eventual redemption through basic compassion.',
    cast: 'Tim Robbins, Morgan Freeman, Bob Gunton, William Sadler',
    duration: '2h 22m',
    year: 1994,
    status: 'watched',
  },
];

async function seedDemoData() {
  console.log('🎬 Seeding demo account with sample movies...\n');

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@unscroll.app';

  try {
    // Find or create demo user
    let demoUser;
    try {
      demoUser = await auth.getUserByEmail(demoEmail);
      console.log(`Found existing demo user: ${demoUser.uid}`);
    } catch {
      // Create demo user if doesn't exist
      demoUser = await auth.createUser({
        email: demoEmail,
        password: 'demo-password-123',
        displayName: 'Demo User',
      });
      console.log(`Created demo user: ${demoUser.uid}`);

      // Create user document
      await db.collection('users').doc(demoUser.uid).set({
        email: demoEmail,
        username: 'Demo User',
        isDemo: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Delete existing media items for demo user
    const existingItems = await db
      .collection('media_items')
      .where('user_id', '==', demoUser.uid)
      .get();

    if (existingItems.size > 0) {
      const batch = db.batch();
      existingItems.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${existingItems.size} existing items`);
    }

    // Add sample movies
    console.log('\nAdding sample movies:');
    for (const movie of sampleMovies) {
      const docRef = await db.collection('media_items').add({
        ...movie,
        format: 'movie',
        user_id: demoUser.uid,
        created_at: new Date().toISOString(),
      });
      
      const statusEmoji = movie.status === 'unwatched' ? '🔴' : movie.status === 'watching' ? '🟡' : '🟢';
      console.log(`  ${statusEmoji} ${movie.title} (${movie.year})`);
    }

    console.log(`\n✅ Successfully added ${sampleMovies.length} movies to demo account!`);
    console.log('\nBreakdown:');
    console.log(`  🔴 Unwatched: ${sampleMovies.filter(m => m.status === 'unwatched').length}`);
    console.log(`  🟡 Watching: ${sampleMovies.filter(m => m.status === 'watching').length}`);
    console.log(`  🟢 Watched: ${sampleMovies.filter(m => m.status === 'watched').length}`);

  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData().then(() => process.exit(0));
