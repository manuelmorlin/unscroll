/**
 * Database Types for Firestore
 */

export type MediaFormat = 'movie';

export type MediaStatus = 'unwatched' | 'watching' | 'watched';

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  plot: string | null;
  cast: string[] | null;
  duration: string | null;
  format: MediaFormat;
  status: MediaStatus;
  poster_url: string | null;
  year: number | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItemInsert {
  title: string;
  genre?: string | null;
  plot?: string | null;
  cast?: string[] | null;
  duration?: string | null;
  format?: MediaFormat;
  status?: MediaStatus;
  poster_url?: string | null;
  year?: number | null;
  rating?: number | null;
}

export interface MediaItemUpdate {
  title?: string;
  genre?: string | null;
  plot?: string | null;
  cast?: string[] | null;
  duration?: string | null;
  format?: MediaFormat;
  status?: MediaStatus;
  poster_url?: string | null;
  year?: number | null;
  rating?: number | null;
  updated_at?: string;
}

// Auth types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  isDemo: boolean;
  createdAt: string;
}

// Realtime payload type (for compatibility)
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: MediaItem | null;
  old: MediaItem | null;
}
