'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { MediaItem, RealtimePayload } from '@/types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseMediaItemsReturn {
  mediaItems: MediaItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  unwatchedCount: number;
  watchedCount: number;
}

/**
 * Custom hook for fetching and subscribing to media items
 * Implements Supabase Realtime for instant sync across devices
 */
export function useMediaItems(): UseMediaItemsReturn {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  // Fetch media items
  const fetchMediaItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        setMediaItems([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('media_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMediaItems(data || []);
    } catch (err) {
      console.error('Error fetching media items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch media');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<MediaItem>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setMediaItems((current) => {
        switch (eventType) {
          case 'INSERT':
            // Add new item at the beginning
            if (newRecord) {
              return [newRecord as MediaItem, ...current];
            }
            return current;

          case 'UPDATE':
            // Update existing item
            if (newRecord) {
              return current.map((item) =>
                item.id === (newRecord as MediaItem).id
                  ? (newRecord as MediaItem)
                  : item
              );
            }
            return current;

          case 'DELETE':
            // Remove deleted item
            if (oldRecord) {
              return current.filter(
                (item) => item.id !== (oldRecord as MediaItem).id
              );
            }
            return current;

          default:
            return current;
        }
      });
    },
    []
  );

  // Setup realtime subscription
  useEffect(() => {
    let mounted = true;

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      // Initial fetch
      await fetchMediaItems();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('media_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'media_items',
            filter: `user_id=eq.${user.id}`,
          },
          handleRealtimeUpdate
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('🔴 Realtime: Connected to media_items');
          }
        });

      return () => {
        console.log('🔴 Realtime: Disconnecting...');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();

    return () => {
      mounted = false;
      cleanup.then((unsub) => unsub?.());
    };
  }, [supabase, fetchMediaItems, handleRealtimeUpdate]);

  // Computed values
  const unwatchedCount = mediaItems.filter(
    (item) => item.status === 'unwatched'
  ).length;
  const watchedCount = mediaItems.filter(
    (item) => item.status === 'watched'
  ).length;

  return {
    mediaItems,
    isLoading,
    error,
    refetch: fetchMediaItems,
    unwatchedCount,
    watchedCount,
  };
}
