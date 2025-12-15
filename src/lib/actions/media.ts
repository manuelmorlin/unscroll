'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to add media',
    };
  }

  const { data, error } = await supabase
    .from('media_items')
    .insert({
      ...mediaData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Add media error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/app');

  return {
    success: true,
    data,
  };
}

// ==============================================
// UPDATE MEDIA ITEM
// ==============================================

export async function updateMediaItem(
  id: string,
  updates: MediaItemUpdate
): Promise<MediaActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to update media',
    };
  }

  const { data, error } = await supabase
    .from('media_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Update media error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/app');

  return {
    success: true,
    data,
  };
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to delete media',
    };
  }

  const { error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete media error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/app');

  return {
    success: true,
  };
}

// ==============================================
// GET RANDOM UNWATCHED
// ==============================================

export async function getRandomUnwatched(): Promise<MediaActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in',
    };
  }

  // Using the database function for true randomness
  const { data, error } = await supabase
    .rpc('get_random_unwatched_media', { p_user_id: user.id })
    .single();

  if (error) {
    // Fallback to client-side random if function doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('media_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'unwatched');

    if (fallbackError || !fallbackData || fallbackData.length === 0) {
      return {
        success: false,
        error: 'No unwatched media found. Add something to your list!',
      };
    }

    const randomIndex = Math.floor(Math.random() * fallbackData.length);
    return {
      success: true,
      data: fallbackData[randomIndex],
    };
  }

  if (!data) {
    return {
      success: false,
      error: 'No unwatched media found. Add something to your list!',
    };
  }

  return {
    success: true,
    data,
  };
}
