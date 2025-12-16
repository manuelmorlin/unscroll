'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { MediaItem } from '@/types/database';

interface UseMediaItemsReturn {
  mediaItems: MediaItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  unwatchedCount: number;
  watchedCount: number;
}

/**
 * Custom hook for fetching and subscribing to media items
 * Implements Firestore Realtime for instant sync across devices
 */
export function useMediaItems(): UseMediaItemsReturn {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      if (!user) {
        setMediaItems([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refetch function (triggers re-subscription)
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Subscribe to Firestore realtime updates
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const mediaQuery = query(
      collection(db, 'media_items'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      mediaQuery,
      (snapshot) => {
        const items: MediaItem[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
          } as MediaItem)
        );

        setMediaItems(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, refreshKey]);

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
    refetch,
    unwatchedCount,
    watchedCount,
  };
}
