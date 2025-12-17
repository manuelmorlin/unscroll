/**
 * Add movies to betta&manu account
 */

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

const auth = getAuth(app);
const db = getFirestore(app);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function searchTMDB(title: string, year?: number) {
  if (!TMDB_API_KEY) return null;
  
  try {
    const query = encodeURIComponent(title);
    const yearParam = year ? `&year=${year}` : '';
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}&language=en-US`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.results?.length > 0) {
      const movieId = searchData.results[0].id;
      const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=en-US`;
      const detailsRes = await fetch(detailsUrl);
      return await detailsRes.json();
    }
    return null;
  } catch {
    return null;
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const movies = [
  { title: 'Bugonia', year: 2025 },
  { title: 'Parasite', year: 2019 },
  { title: 'The Imitation Game', year: 2014 },
  { title: 'Coco', year: 2017 },
  { title: 'The Pianist', year: 2002 },
  { title: 'The Lobster', year: 2015 },
  { title: 'Notting Hill', year: 1999 },
  { title: 'Your Name', year: 2016 },
  { title: 'The Great Gatsby', year: 2013 },
  { title: 'Love Actually', year: 2003 },
  { title: 'Eternal Sunshine of the Spotless Mind', year: 2004 },
  { title: 'Shutter Island', year: 2010 },
  { title: 'The Fabelmans', year: 2022 },
  { title: 'Blade Runner 2049', year: 2017 },
];

async function main() {
  console.log('🎬 Adding movies to betta&manu...\n');

  const email = 'betta-luna@hotmail.it';
  
  // Get user
  const user = await auth.getUserByEmail(email);
  const userId = user.uid;
  console.log(`Found user: ${userId}\n`);

  // Check existing movies
  const existing = await db.collection('users').doc(userId).collection('mediaItems').get();
  console.log(`Current movies: ${existing.size}`);
  
  if (existing.size > 0) {
    console.log('Clearing existing movies...');
    const batch = db.batch();
    existing.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log('\nAdding movies with TMDB data:\n');

  for (const movie of movies) {
    const tmdb = await searchTMDB(movie.title, movie.year);
    
    const mediaItem: Record<string, string | string[] | null> = {
      title: tmdb?.title || movie.title,
      year: tmdb?.release_date?.split('-')[0] || movie.year?.toString(),
      format: 'movie',
      status: 'unwatched',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      watched_at: null,
      user_rating: null,
      user_review: null,
    };

    if (tmdb) {
      mediaItem.duration = tmdb.runtime ? formatDuration(tmdb.runtime) : null;
      mediaItem.genre = tmdb.genres?.map((g: { name: string }) => g.name).join(', ') || null;
      mediaItem.plot = tmdb.overview || null;
      mediaItem.cast = tmdb.credits?.cast?.slice(0, 5).map((c: { name: string }) => c.name) || null;
    }

    await db.collection('users').doc(userId).collection('mediaItems').add(mediaItem);
    console.log(`   ✅ ${mediaItem.title} (${mediaItem.year})`);
  }

  console.log(`\n✅ Added ${movies.length} movies to betta&manu`);
  process.exit(0);
}

main().catch(console.error);
