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
  return updateMediaItem(id, { 
    status: 'watched', 
    watched_at: new Date().toISOString() 
  });
}

// ==============================================
// REWATCH - Mark as watched again (increment counter and add date)
// ==============================================

export async function markAsRewatched(id: string, date?: string): Promise<MediaActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: 'You must be logged in to rewatch media',
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

    const currentRewatchCount = docData?.rewatch_count || 0;
    const currentRewatchDates: string[] = docData?.rewatch_dates || [];
    const rewatchDate = date || new Date().toISOString();

    await docRef.update({
      rewatch_count: currentRewatchCount + 1,
      rewatch_dates: [...currentRewatchDates, rewatchDate],
      updated_at: new Date().toISOString(),
    });

    revalidatePath('/app');

    return {
      success: true,
      data: { rewatch_count: currentRewatchCount + 1 },
    };
  } catch (error) {
    console.error('Rewatch media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as rewatched',
    };
  }
}

// ==============================================
// REMOVE REWATCH - Remove a specific rewatch by index
// ==============================================

export async function removeRewatch(id: string, index?: number): Promise<MediaActionResult> {
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

    const currentRewatchCount = docData?.rewatch_count || 0;
    const currentRewatchDates: string[] = docData?.rewatch_dates || [];
    
    if (currentRewatchCount <= 0) {
      return {
        success: false,
        error: 'No rewatches to remove',
      };
    }

    // Remove the specific date or the last one
    const newRewatchDates = [...currentRewatchDates];
    if (index !== undefined && index >= 0 && index < newRewatchDates.length) {
      newRewatchDates.splice(index, 1);
    } else if (newRewatchDates.length > 0) {
      newRewatchDates.pop();
    }

    await docRef.update({
      rewatch_count: currentRewatchCount - 1,
      rewatch_dates: newRewatchDates,
      updated_at: new Date().toISOString(),
    });

    revalidatePath('/app');

    return {
      success: true,
      data: { rewatch_count: currentRewatchCount - 1 },
    };
  } catch (error) {
    console.error('Remove rewatch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove rewatch',
    };
  }
}

// ==============================================
// UPDATE WATCH DATE
// ==============================================

export async function updateWatchDate(id: string, date: string): Promise<MediaActionResult> {
  return updateMediaItem(id, { watched_at: date });
}

// ==============================================
// UPDATE STATUS
// ==============================================

export async function updateMediaStatus(
  id: string,
  status: MediaStatus,
  watchedAt?: string | null // Optional: full date ISO string, year-only string like "2024", or null/undefined for no date
): Promise<MediaActionResult> {
  // If marking as watched, set watched_at date and reset rewatch counters
  if (status === 'watched') {
    return updateMediaItem(id, { 
      status, 
      watched_at: watchedAt !== undefined ? watchedAt : new Date().toISOString(),
      rewatch_count: 0,
      rewatch_dates: [],
    });
  }
  // If moving away from watched, clear watched_at, rating, review and rewatch data
  return updateMediaItem(id, { 
    status,
    watched_at: null,
    user_rating: null,
    user_review: null,
    rewatch_count: 0,
    rewatch_dates: [],
  });
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
  genres?: string[]; // Array of genres (film must match at least one)
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

    // Filter by genres if specified (film must match at least one)
    if (filters?.genres && filters.genres.length > 0) {
      docs = docs.filter(doc => {
        const data = doc.data();
        if (!data.genre) return false;
        const filmGenres = data.genre.toLowerCase();
        return filters.genres!.some(g => filmGenres.includes(g.toLowerCase()));
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
      if (filters?.genres && filters.genres.length > 0) filterParts.push(filters.genres.join(', '));
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
        // Split by comma or slash and add each genre
        const genres = data.genre.split(/,|\//).map((g: string) => g.trim());
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
