/**
 * Script to create betta&manu account with movies
 * Run with: npx tsx scripts/seed-betta-account.ts
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

// Movies to add - all unwatched
const movies = [
  {
    title: 'Bugonia',
    genre: 'Sci-Fi, Comedy',
    plot: 'Two conspiracy theorists believe their new boss is an alien and hatch a plan to expose her before she can destroy the planet.',
    cast: 'Emma Stone, Jesse Plemons, Margaret Qualley, Willem Dafoe',
    duration: '1h 34m',
    year: 2025,
    status: 'unwatched',
  },
  {
    title: 'Parasite',
    genre: 'Drama, Thriller',
    plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    cast: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik',
    duration: '2h 12m',
    year: 2019,
    status: 'unwatched',
  },
  {
    title: 'The Imitation Game',
    genre: 'Biography, Drama, Thriller',
    plot: 'During World War II, the English mathematical genius Alan Turing tries to crack the German Enigma code with help from fellow mathematicians.',
    cast: 'Benedict Cumberbatch, Keira Knightley, Matthew Goode, Mark Strong',
    duration: '1h 54m',
    year: 2014,
    status: 'unwatched',
  },
  {
    title: 'Coco',
    genre: 'Animation, Adventure, Drama',
    plot: 'Aspiring musician Miguel, confronted with his family\'s ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather.',
    cast: 'Anthony Gonzalez, Gael García Bernal, Benjamin Bratt, Alanna Ubach',
    duration: '1h 45m',
    year: 2017,
    status: 'unwatched',
  },
  {
    title: 'The Pianist',
    genre: 'Biography, Drama, Music',
    plot: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto during World War II.',
    cast: 'Adrien Brody, Thomas Kretschmann, Frank Finlay, Emilia Fox',
    duration: '2h 30m',
    year: 2002,
    status: 'unwatched',
  },
  {
    title: 'The Lobster',
    genre: 'Comedy, Drama, Romance',
    plot: 'In a dystopian near future, single people must find a romantic partner or be transformed into animals.',
    cast: 'Colin Farrell, Rachel Weisz, Jessica Barden, Olivia Colman',
    duration: '1h 59m',
    year: 2015,
    status: 'unwatched',
  },
  {
    title: 'Notting Hill',
    genre: 'Comedy, Drama, Romance',
    plot: 'The life of a simple bookshop owner changes when he meets the most famous film star in the world.',
    cast: 'Julia Roberts, Hugh Grant, Richard McCabe, Rhys Ifans',
    duration: '2h 4m',
    year: 1999,
    status: 'unwatched',
  },
  {
    title: 'Your Name',
    genre: 'Animation, Drama, Fantasy',
    plot: 'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?',
    cast: 'Ryunosuke Kamiki, Mone Kamishiraishi, Ryo Narita, Aoi Yuki',
    duration: '1h 46m',
    year: 2016,
    status: 'unwatched',
  },
  {
    title: 'The Great Gatsby',
    genre: 'Drama, Romance',
    plot: 'A writer and wall street trader recounts his encounter with the wealthy Jay Gatsby and his obsession to reunite with his former lover.',
    cast: 'Leonardo DiCaprio, Carey Mulligan, Joel Edgerton, Tobey Maguire',
    duration: '2h 23m',
    year: 2013,
    status: 'unwatched',
  },
  {
    title: 'Me Before You',
    genre: 'Drama, Romance',
    plot: 'A girl in a small town forms an unlikely bond with a recently-paralyzed man she\'s taking care of.',
    cast: 'Emilia Clarke, Sam Claflin, Janet McTeer, Charles Dance',
    duration: '1h 50m',
    year: 2016,
    status: 'unwatched',
  },
  {
    title: 'Rent',
    genre: 'Drama, Musical, Romance',
    plot: 'This is the film version of the Pulitzer and Tony Award winning musical about Bohemians in the East Village of New York City struggling with life, love and AIDS.',
    cast: 'Rosario Dawson, Taye Diggs, Wilson Jermaine Heredia, Jesse L. Martin',
    duration: '2h 15m',
    year: 2005,
    status: 'unwatched',
  },
  {
    title: 'Hamilton',
    genre: 'Biography, Drama, History',
    plot: 'The real life of one of America\'s foremost founding fathers and first Secretary of the Treasury, Alexander Hamilton.',
    cast: 'Lin-Manuel Miranda, Daveed Diggs, Renée Elise Goldsberry, Leslie Odom Jr.',
    duration: '2h 40m',
    year: 2020,
    status: 'unwatched',
  },
  {
    title: 'The Da Vinci Code',
    genre: 'Mystery, Thriller',
    plot: 'A murder inside the Louvre, and clues in Da Vinci paintings, lead to the discovery of a religious mystery protected by a secret society for two thousand years.',
    cast: 'Tom Hanks, Audrey Tautou, Jean Reno, Ian McKellen',
    duration: '2h 29m',
    year: 2006,
    status: 'unwatched',
  },
  {
    title: 'Joseph: King of Dreams',
    genre: 'Animation, Adventure, Drama',
    plot: 'The story of Joseph, who was sold into slavery by his jealous brothers, and who ascended to become the second most powerful man in Egypt.',
    cast: 'Ben Affleck, Mark Hamill, Richard Herd, Maureen McGovern',
    duration: '1h 15m',
    year: 2000,
    status: 'unwatched',
  },
];

async function seedBettaAccount() {
  console.log('🎬 Creating betta&manu account with movies...\n');

  const email = 'betta-luna@hotmail.it';
  const username = 'betta&manu';
  const password = '03082023';

  try {
    // Check if user exists, delete if so
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`User exists, deleting old account: ${user.uid}`);
      
      // Delete existing media items
      const existingItems = await db
        .collection('media_items')
        .where('user_id', '==', user.uid)
        .get();

      if (existingItems.size > 0) {
        const batch = db.batch();
        existingItems.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${existingItems.size} existing items`);
      }

      // Delete user document
      await db.collection('users').doc(user.uid).delete();
      
      // Delete auth user
      await auth.deleteUser(user.uid);
      console.log('Old account deleted');
    } catch {
      // User doesn't exist, that's fine
    }

    // Create new user
    user = await auth.createUser({
      email,
      password,
      displayName: username,
    });
    console.log(`✅ Created user: ${user.uid}`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

    // Create user document
    await db.collection('users').doc(user.uid).set({
      email,
      username,
      createdAt: new Date().toISOString(),
    });

    // Add movies
    console.log('\n📽️  Adding movies:');
    for (const movie of movies) {
      await db.collection('media_items').add({
        ...movie,
        format: 'movie',
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });
      console.log(`  🔴 ${movie.title} (${movie.year})`);
    }

    console.log(`\n✅ Successfully added ${movies.length} movies!`);
    console.log('\n📧 Account ready:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedBettaAccount().then(() => process.exit(0));
