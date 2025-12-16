import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * Server-side only - never expose to client
 */

// Make OpenAI optional - AI features won't work without the key
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Model configuration - using gpt-4o-mini as gpt-5.1-mini doesn't exist yet
// Change to 'gpt-5.1-mini' when available
export const AI_MODEL = 'gpt-4o-mini';

// Fallback model for testing
export const FALLBACK_MODEL = 'gpt-3.5-turbo';
