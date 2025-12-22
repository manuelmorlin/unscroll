/**
 * Script to update all existing media items with new genre format
 * - Max 2 genres
 * - Separated by /
 * - Abbreviations (Science Fiction -> Sci-Fi, etc.)
 * 
 * Run with: npx tsx scripts/update-genres.ts
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

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Genre abbreviations
const genreAbbreviations: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'Documentary': 'Doc',
  'Animation': 'Animated',
  'TV Movie': 'TV',
};

// Format genre string from array
function formatGenres(genres: { id: number; name: string }[]): string {
  return genres
    .slice(0, 2)
    .map(g => genreAbbreviations[g.name] || g.name)
    .join('/');
}

// Search TMDB by title to get movie ID
async function searchMovie(title: string, year?: number): Promise<number | null> {
  try {
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`;
    if (year) {
      url += `&year=${year}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

// Get movie details from TMDB
async function getMovieGenres(movieId: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.genres && data.genres.length > 0) {
      return formatGenres(data.genres);
    }
    return null;
  } catch {
    return null;
  }
}

async function updateAllGenres() {
  console.log('🎬 Starting genre update for all media items...\n');
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`\n👤 Processing user: ${userId}`);
    
    // Get all media items for this user
    const mediaSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('media')
      .get();
    
    for (const mediaDoc of mediaSnapshot.docs) {
      const media = mediaDoc.data();
      const title = media.title;
      const year = media.year;
      
      // Check if genre needs updating (has comma or more than 2 genres with /)
      const currentGenre = media.genre || '';
      const hasComma = currentGenre.includes(',');
      const slashCount = (currentGenre.match(/\//g) || []).length;
      const needsUpdate = hasComma || slashCount > 1 || currentGenre.includes('Science Fiction');
      
      if (!needsUpdate && currentGenre) {
        console.log(`  ⏭️  Skipping "${title}" - already formatted: ${currentGenre}`);
        totalSkipped++;
        continue;
      }
      
      // Search for movie on TMDB
      const movieId = await searchMovie(title, year);
      
      if (!movieId) {
        console.log(`  ❌ Could not find "${title}" (${year}) on TMDB`);
        totalFailed++;
        continue;
      }
      
      // Get new genre format
      const newGenre = await getMovieGenres(movieId);
      
      if (!newGenre) {
        console.log(`  ❌ Could not get genres for "${title}"`);
        totalFailed++;
        continue;
      }
      
      // Update the document
      await db
        .collection('users')
        .doc(userId)
        .collection('media')
        .doc(mediaDoc.id)
        .update({ genre: newGenre });
      
      console.log(`  ✅ Updated "${title}": ${currentGenre || '(empty)'} → ${newGenre}`);
      totalUpdated++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Updated: ${totalUpdated}`);
  console.log(`   ⏭️  Skipped: ${totalSkipped}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log('='.repeat(50));
}

// Run the script
updateAllGenres()
  .then(() => {
    console.log('\n✨ Genre update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
