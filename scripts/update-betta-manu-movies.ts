/**
 * Script to update betta&manu's movies with TMDB data
 * Run with: npx tsx scripts/update-betta-manu-movies.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
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

const db = getFirestore(app);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Movies to search (using English titles for TMDB)
const moviesToAdd = [
  'Bugonia',
  'Parasite',
  'The Imitation Game',
  'Coco',
  'The Pianist', // Il Pianista
  'The Lobster',
  'Notting Hill',
  'Your Name', // Kimi no Na wa
  'The Great Gatsby',
  'Me Before You',
  'Rent',
  'Hamilton',
  'The Da Vinci Code', // Il Codice da Vinci
  'Joseph: King of Dreams', // Giuseppe il Re dei Sogni
];

interface TMDBSearchResult {
  results: {
    id: number;
    title: string;
    release_date?: string;
  }[];
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
}

interface TMDBCredits {
  cast: { id: number; name: string; character: string; order: number }[];
}

async function searchMovie(query: string): Promise<number | null> {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
  );
  
  if (!response.ok) {
    console.error(`   ❌ Search failed for: ${query}`);
    return null;
  }
  
  const data: TMDBSearchResult = await response.json();
  
  if (data.results.length === 0) {
    console.error(`   ❌ No results for: ${query}`);
    return null;
  }
  
  return data.results[0].id;
}

async function getMovieDetails(movieId: number) {
  const [detailsRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`),
    fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`),
  ]);
  
  if (!detailsRes.ok || !creditsRes.ok) {
    return null;
  }
  
  const details: TMDBMovieDetails = await detailsRes.json();
  const credits: TMDBCredits = await creditsRes.json();
  
  // Format duration
  const hours = details.runtime ? Math.floor(details.runtime / 60) : 0;
  const minutes = details.runtime ? details.runtime % 60 : 0;
  const duration = details.runtime 
    ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
    : null;
  
  // Get top 4 cast members
  const cast = credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 4)
    .map(actor => actor.name)
    .join(', ');
  
  // Get genres
  const genre = details.genres.map(g => g.name).join(', ');
  
  // Get year from release date
  const year = details.release_date 
    ? parseInt(details.release_date.split('-')[0], 10)
    : null;
  
  return {
    title: details.title,
    year,
    genre,
    duration,
    plot: details.overview || null,
    cast,
  };
}

async function main() {
  console.log('\n🎬 UNSCROLL - Update Movies with TMDB Data\n');
  console.log('==========================================\n');
  
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found in environment variables!');
    process.exit(1);
  }
  
  // Find betta&manu user
  const usersSnapshot = await db.collection('users')
    .where('username', '==', 'betta&manu')
    .get();
  
  if (usersSnapshot.empty) {
    console.error('❌ User betta&manu not found!');
    process.exit(1);
  }
  
  const userId = usersSnapshot.docs[0].id;
  console.log(`👤 Found user: betta&manu (${userId})\n`);
  
  // Delete existing movies for this user
  console.log('🗑️  Deleting existing movies...');
  const existingMovies = await db.collection('media_items')
    .where('user_id', '==', userId)
    .get();
  
  const batch = db.batch();
  existingMovies.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`   Deleted ${existingMovies.size} movies\n`);
  
  // Add movies with TMDB data
  console.log('🎬 Adding movies with full TMDB data...\n');
  
  const now = new Date().toISOString();
  let successCount = 0;
  
  for (const movieQuery of moviesToAdd) {
    console.log(`🔍 Searching: ${movieQuery}`);
    
    // Search for movie
    const movieId = await searchMovie(movieQuery);
    if (!movieId) continue;
    
    // Get full details
    const details = await getMovieDetails(movieId);
    if (!details) {
      console.log(`   ❌ Could not get details`);
      continue;
    }
    
    // Add to Firestore
    const docRef = db.collection('media_items').doc();
    await docRef.set({
      id: docRef.id,
      user_id: userId,
      title: details.title,
      year: details.year,
      genre: details.genre,
      duration: details.duration,
      plot: details.plot,
      cast: details.cast,
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
    
    console.log(`   ✓ ${details.title} (${details.year})`);
    console.log(`     Genre: ${details.genre}`);
    console.log(`     Cast: ${details.cast}`);
    console.log(`     Duration: ${details.duration}`);
    console.log('');
    
    successCount++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  console.log('==========================================');
  console.log(`✅ Added ${successCount}/${moviesToAdd.length} movies with full data!\n`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
