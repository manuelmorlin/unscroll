'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBSearchResult {
  results: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    release_date?: string;
  }>;
}

async function searchTMDB(title: string, year?: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    // Search with year if available for better accuracy
    const yearParam = year ? `&year=${year}` : '';
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}&language=en-US&page=1`
    );

    if (!response.ok) return null;

    const data: TMDBSearchResult = await response.json();
    
    if (data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Simple auth check - require a secret key
  const authHeader = request.headers.get('Authorization');
  const expectedKey = process.env.ADMIN_SECRET_KEY || 'update-posters-2024';
  
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all media items without poster_url
    const snapshot = await adminDb.collection('media_items').get();
    
    const updates: Array<{ id: string; title: string; status: string; poster_url?: string }> = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already has poster
      if (data.poster_url) {
        skipped++;
        continue;
      }

      const posterUrl = await searchTMDB(data.title, data.year);
      
      if (posterUrl) {
        await adminDb.collection('media_items').doc(doc.id).update({
          poster_url: posterUrl,
          updated_at: new Date().toISOString(),
        });
        updates.push({ id: doc.id, title: data.title, status: 'updated', poster_url: posterUrl });
        updated++;
      } else {
        updates.push({ id: doc.id, title: data.title, status: 'not_found' });
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: snapshot.docs.length,
        updated,
        skipped,
        failed,
      },
      details: updates,
    });
  } catch (error) {
    console.error('Update posters error:', error);
    return NextResponse.json(
      { error: 'Failed to update posters', details: String(error) },
      { status: 500 }
    );
  }
}
