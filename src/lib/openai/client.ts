import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * Server-side only - never expose to client
 */

// Make OpenAI optional - AI features won't work without the key
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const AI_MODEL = 'gpt-5-mini';

// Fallback model for testing
export const FALLBACK_MODEL = 'gpt-3.5-turbo';
