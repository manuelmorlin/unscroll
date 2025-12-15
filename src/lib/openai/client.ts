import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * Server-side only - never expose to client
 */

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration - using gpt-4o-mini as gpt-5.1-mini doesn't exist yet
// Change to 'gpt-5.1-mini' when available
export const AI_MODEL = 'gpt-4o-mini';

// Fallback model for testing
export const FALLBACK_MODEL = 'gpt-3.5-turbo';
