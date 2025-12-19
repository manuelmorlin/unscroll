'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
}

interface TMDBCredits {
  cast: { id: number; name: string; character: string; order: number }[];
  crew: { id: number; name: string; job: string; department: string }[];
}

async function searchMovieByTitleAndYear(title: string, year: number | null): Promise<number | null> {
  const yearParam = year ? `&year=${year}` : '';
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}&language=en-US&page=1`
  );
  
  if (!response.ok) return null;
  
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  return null;
}

async function getMovieFullDetails(movieId: number) {
  const [detailsRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`),
    fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`),
  ]);

  if (!detailsRes.ok || !creditsRes.ok) return null;

  const details: TMDBMovieDetails = await detailsRes.json();
  const credits: TMDBCredits = await creditsRes.json();

  // Format duration
  const hours = details.runtime ? Math.floor(details.runtime / 60) : 0;
  const minutes = details.runtime ? details.runtime % 60 : 0;
  const duration = details.runtime 
    ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
    : null;

  // Get all cast members
  const cast = credits.cast
    .sort((a, b) => a.order - b.order)
    .map(actor => actor.name);

  // Get director
  const director = credits.crew.find(member => member.job === 'Director')?.name || null;

  // Get genres
  const genre = details.genres.map(g => g.name).join(', ');

  // Get year
  const year = details.release_date 
    ? parseInt(details.release_date.split('-')[0], 10)
    : null;

  // Build poster URL
  const poster_url = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : null;

  return {
    genre,
    plot: details.overview || null,
    cast,
    director,
    duration,
    year,
    poster_url,
  };
}

export async function POST(request: Request) {
  // Simple auth check
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'update-movies-2024'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
  }

  try {
    // Get all media items
    const snapshot = await adminDb.collection('media_items').get();
    
    const results = {
      total: snapshot.docs.length,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as { title: string; status: string; error?: string }[],
    };

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const title = data.title;
      const year = data.year;

      try {
        // Search for movie on TMDB
        const movieId = await searchMovieByTitleAndYear(title, year);
        
        if (!movieId) {
          results.skipped++;
          results.details.push({ title, status: 'skipped', error: 'Not found on TMDB' });
          continue;
        }

        // Get full details
        const movieDetails = await getMovieFullDetails(movieId);
        
        if (!movieDetails) {
          results.failed++;
          results.details.push({ title, status: 'failed', error: 'Could not fetch details' });
          continue;
        }

        // Update the document
        await adminDb.collection('media_items').doc(doc.id).update({
          genre: movieDetails.genre || data.genre,
          plot: movieDetails.plot || data.plot,
          cast: movieDetails.cast.length > 0 ? movieDetails.cast : data.cast,
          director: movieDetails.director,
          duration: movieDetails.duration || data.duration,
          year: movieDetails.year || data.year,
          poster_url: movieDetails.poster_url || data.poster_url,
          updated_at: new Date().toISOString(),
        });

        results.updated++;
        results.details.push({ title, status: 'updated' });

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.details.push({ 
          title, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Update movies error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update movies' },
      { status: 500 }
    );
  }
}
