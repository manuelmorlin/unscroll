/**
 * Supabase Database Types
 * Auto-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 * For now, we define them manually for type safety
 */

export type MediaFormat = 'movie' | 'series' | 'documentary' | 'anime';

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

export interface Database {
  public: {
    Tables: {
      media_items: {
        Row: MediaItem;
        Insert: MediaItemInsert & { user_id: string };
        Update: MediaItemUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_format: MediaFormat;
      media_status: MediaStatus;
    };
  };
}

// Auth types for demo mode
export interface UserProfile {
  id: string;
  email: string;
  is_demo: boolean;
  created_at: string;
}

// Realtime payload types
export interface RealtimePayload<T> {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
  schema: string;
  table: string;
}
