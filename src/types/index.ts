export * from './database';

// AI Response types
export interface AutofillResponse {
  genre: string;
  plot: string;
  cast: string[];
  duration: string;
  format: 'movie';
  year: number;
  found?: boolean;
}

export interface PersuadeResponse {
  phrase: string;
  mood: 'excited' | 'intriguing' | 'cozy' | 'thrilling';
  emoji: string;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  isDemo: boolean;
  userId: string | null;
  email: string | null;
}

// Slot Machine state
export interface SlotMachineState {
  isSpinning: boolean;
  selectedMedia: import('./database').MediaItem | null;
  persuasivePhrase: string | null;
}
