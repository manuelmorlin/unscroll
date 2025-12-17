'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { getCurrentUser } from './auth';
import type { MediaItemInsert, MediaItemUpdate, MediaStatus } from '@/types/database';

// ==============================================
// TYPES
// ==============================================

export interface MediaActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ==============================================
// ADD MEDIA ITEM
// ==============================================

export async function addMediaItem(
  mediaData: MediaItemInsert
): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in to add media',
    };
  }

  try {
    const docRef = adminDb.collection('media_items').doc();
    const now = new Date().toISOString();

    const mediaItem = {
      ...mediaData,
      id: docRef.id,
      user_id: user.id,
      status: mediaData.status || 'unwatched',
      format: mediaData.format || 'movie',
      created_at: now,
      updated_at: now,
    };

    await docRef.set(mediaItem);

    revalidatePath('/app');

    return {
      success: true,
      data: mediaItem,
    };
  } catch (error) {
    console.error('Add media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add media',
    };
  }
}

// ==============================================
// UPDATE MEDIA ITEM
// ==============================================

export async function updateMediaItem(
  id: string,
  updates: MediaItemUpdate
): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in to update media',
    };
  }

  try {
    const docRef = adminDb.collection('media_items').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Media item not found',
      };
    }

    const docData = doc.data();
    if (docData?.user_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to update this item',
      };
    }

    await docRef.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    const updatedDoc = await docRef.get();

    revalidatePath('/app');

    return {
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    };
  } catch (error) {
    console.error('Update media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update media',
    };
  }
}

// ==============================================
// MARK AS WATCHED
// ==============================================

export async function markAsWatched(id: string): Promise<MediaActionResult> {
  return updateMediaItem(id, { status: 'watched' });
}

// ==============================================
// UPDATE STATUS
// ==============================================

export async function updateMediaStatus(
  id: string,
  status: MediaStatus
): Promise<MediaActionResult> {
  return updateMediaItem(id, { status });
}

// ==============================================
// DELETE MEDIA ITEM
// ==============================================

export async function deleteMediaItem(id: string): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in to delete media',
    };
  }

  try {
    const docRef = adminDb.collection('media_items').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Media item not found',
      };
    }

    const docData = doc.data();
    if (docData?.user_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to delete this item',
      };
    }

    await docRef.delete();

    revalidatePath('/app');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete media',
    };
  }
}

// ==============================================
// GET RANDOM UNWATCHED
// ==============================================

// ==============================================
// SPIN FILTERS TYPE
// ==============================================

export interface SpinFilters {
  genre?: string;
  maxDuration?: number; // in minutes
  mood?: string;
  excludeIds?: string[]; // IDs of films to exclude (already shown in current spin session)
}

// Helper to parse duration string to minutes
function parseDurationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)\s*h/);
  const minutesMatch = duration.match(/(\d+)\s*m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

// Mood keywords mapping
const MOOD_KEYWORDS: Record<string, string[]> = {
  'christmas': ['christmas', 'holiday', 'xmas', 'winter', 'snow', 'santa', 'miracle'],
  'romantic': ['romance', 'romantic', 'love', 'wedding', 'relationship'],
  'action': ['action', 'adventure', 'thriller', 'spy', 'war', 'fight'],
  'funny': ['comedy', 'funny', 'humor', 'laugh', 'parody'],
  'scary': ['horror', 'scary', 'thriller', 'suspense', 'terror', 'ghost'],
  'family': ['family', 'animation', 'kids', 'children', 'pixar', 'disney', 'animated'],
  'thoughtful': ['drama', 'biography', 'documentary', 'history', 'thought-provoking'],
};

export async function getRandomUnwatched(filters?: SpinFilters): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in',
    };
  }

  try {
    const snapshot = await adminDb
      .collection('media_items')
      .where('user_id', '==', user.id)
      .where('status', '==', 'unwatched')
      .get();

    if (snapshot.empty) {
      return {
        success: false,
        error: 'No unwatched media found. Add something to your list!',
      };
    }

    let docs = snapshot.docs;

    // Filter by genre if specified
    if (filters?.genre) {
      docs = docs.filter(doc => {
        const data = doc.data();
        return data.genre?.toLowerCase().includes(filters.genre!.toLowerCase());
      });
    }

    // Filter by max duration if specified
    if (filters?.maxDuration) {
      docs = docs.filter(doc => {
        const data = doc.data();
        if (!data.duration) return true; // Include films without duration info
        const filmMinutes = parseDurationToMinutes(data.duration);
        return filmMinutes <= filters.maxDuration!;
      });
    }

    // Filter by mood if specified
    if (filters?.mood) {
      const moodKeywords = MOOD_KEYWORDS[filters.mood.toLowerCase()] || [];
      if (moodKeywords.length > 0) {
        docs = docs.filter(doc => {
          const data = doc.data();
          const searchText = `${data.genre || ''} ${data.plot || ''} ${data.title || ''}`.toLowerCase();
          return moodKeywords.some(keyword => searchText.includes(keyword));
        });
      }
    }

    // Exclude already shown films (from current spin session)
    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      docs = docs.filter(doc => !filters.excludeIds!.includes(doc.id));
    }

    if (docs.length === 0) {
      const filterParts = [];
      if (filters?.genre) filterParts.push(filters.genre);
      if (filters?.maxDuration) filterParts.push(`under ${filters.maxDuration} min`);
      if (filters?.mood) filterParts.push(`${filters.mood} mood`);
      
      return {
        success: false,
        error: `No movies match your filters (${filterParts.join(', ')}). Try different options!`,
      };
    }

    const randomIndex = Math.floor(Math.random() * docs.length);
    const randomDoc = docs[randomIndex];

    return {
      success: true,
      data: { id: randomDoc.id, ...randomDoc.data() },
    };
  } catch (error) {
    console.error('Get random unwatched error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get random media',
    };
  }
}

// ==============================================
// GET ALL GENRES
// ==============================================

export async function getAllGenres(): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in',
    };
  }

  try {
    const snapshot = await adminDb
      .collection('media_items')
      .where('user_id', '==', user.id)
      .where('status', '==', 'unwatched')
      .get();

    const genresSet = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.genre) {
        // Split by comma and add each genre
        const genres = data.genre.split(',').map((g: string) => g.trim());
        genres.forEach((g: string) => genresSet.add(g));
      }
    });

    const genres = Array.from(genresSet).sort();

    return {
      success: true,
      data: genres,
    };
  } catch (error) {
    console.error('Get all genres error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get genres',
    };
  }
}

// ==============================================
// GET ALL MEDIA ITEMS (for server components)
// ==============================================

export async function getMediaItems(): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in',
    };
  }

  try {
    const snapshot = await adminDb
      .collection('media_items')
      .where('user_id', '==', user.id)
      .orderBy('created_at', 'desc')
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error('Get media items error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get media items',
    };
  }
}
