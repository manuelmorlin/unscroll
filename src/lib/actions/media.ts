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

export async function getRandomUnwatched(): Promise<MediaActionResult> {
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

    const docs = snapshot.docs;
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
