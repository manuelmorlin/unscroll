'use server';

import { openai, AI_MODEL } from '@/lib/openai/client';
import { z } from 'zod';
import type { AutofillResponse, PersuadeResponse } from '@/types';

// ==============================================
// VALIDATION SCHEMAS
// ==============================================

const autofillResponseSchema = z.object({
  genre: z.string(),
  plot: z.string(),
  cast: z.array(z.string()),
  duration: z.string(),
  format: z.literal('movie'),
  year: z.number(),
  found: z.boolean().optional(),
});

const persuadeResponseSchema = z.object({
  phrase: z.string(),
  mood: z.enum(['excited', 'intriguing', 'cozy', 'thrilling']),
  emoji: z.string(),
});

// ==============================================
// GENRE-BASED FALLBACK SYSTEM
// ==============================================

interface FallbackData {
  phrase: string;
  mood: 'excited' | 'intriguing' | 'cozy' | 'thrilling';
  emoji: string;
}

const GENRE_FALLBACKS: Record<string, FallbackData[]> = {
  horror: [
    { phrase: "Sleep is overrated anyway.", mood: 'thrilling', emoji: '👻' },
    { phrase: "Keep the lights on. Trust me.", mood: 'thrilling', emoji: '🔪' },
    { phrase: "Your heart rate is about to spike.", mood: 'thrilling', emoji: '💀' },
  ],
  thriller: [
    { phrase: "The twist? You won't see it coming.", mood: 'thrilling', emoji: '🔍' },
    { phrase: "Edge of your seat doesn't cover it.", mood: 'thrilling', emoji: '😰' },
    { phrase: "Your jaw will hit the floor.", mood: 'intriguing', emoji: '🎯' },
  ],
  comedy: [
    { phrase: "Warning: may cause uncontrollable laughter.", mood: 'excited', emoji: '😂' },
    { phrase: "Your cheeks will hurt from smiling.", mood: 'cozy', emoji: '🤣' },
    { phrase: "Pure serotonin in film form.", mood: 'excited', emoji: '😄' },
  ],
  romance: [
    { phrase: "Get the tissues ready.", mood: 'cozy', emoji: '💕' },
    { phrase: "Your heart will thank you.", mood: 'cozy', emoji: '❤️' },
    { phrase: "Love stories don't get better than this.", mood: 'intriguing', emoji: '💝' },
  ],
  action: [
    { phrase: "Buckle up. It's a wild ride.", mood: 'excited', emoji: '💥' },
    { phrase: "Adrenaline rush guaranteed.", mood: 'thrilling', emoji: '🔥' },
    { phrase: "Non-stop from start to finish.", mood: 'excited', emoji: '⚡' },
  ],
  'sci-fi': [
    { phrase: "Prepare to have your mind blown.", mood: 'intriguing', emoji: '🚀' },
    { phrase: "The future never looked this good.", mood: 'excited', emoji: '🤖' },
    { phrase: "Reality will never feel the same.", mood: 'intriguing', emoji: '🌌' },
  ],
  fantasy: [
    { phrase: "Magic awaits. Dive in.", mood: 'excited', emoji: '🧙' },
    { phrase: "A world you won't want to leave.", mood: 'cozy', emoji: '✨' },
    { phrase: "Epic doesn't begin to describe it.", mood: 'excited', emoji: '🐉' },
  ],
  drama: [
    { phrase: "Cinema at its finest.", mood: 'intriguing', emoji: '🎭' },
    { phrase: "The kind of story that stays with you.", mood: 'intriguing', emoji: '💫' },
    { phrase: "Prepare to feel everything.", mood: 'cozy', emoji: '🌟' },
  ],
  animation: [
    { phrase: "Not just for kids. Pure art.", mood: 'excited', emoji: '🎨' },
    { phrase: "Animation perfection.", mood: 'cozy', emoji: '✨' },
    { phrase: "Visually stunning. Emotionally powerful.", mood: 'excited', emoji: '🌈' },
  ],
  christmas: [
    { phrase: "Holiday spirit incoming.", mood: 'cozy', emoji: '🎄' },
    { phrase: "Hot cocoa and blankets required.", mood: 'cozy', emoji: '☃️' },
    { phrase: "The most wonderful time for this film.", mood: 'cozy', emoji: '🎅' },
  ],
  default: [
    { phrase: "This one hits different.", mood: 'intriguing', emoji: '⭐' },
    { phrase: "Cinema magic at its finest.", mood: 'excited', emoji: '🎬' },
    { phrase: "A must-watch experience.", mood: 'excited', emoji: '🍿' },
    { phrase: "You won't regret this choice.", mood: 'intriguing', emoji: '🎥' },
    { phrase: "Trust the universe on this one.", mood: 'cozy', emoji: '✨' },
  ],
};

function getGenreBasedFallback(genre: string, title: string): FallbackData {
  const genreLower = genre?.toLowerCase() || '';
  
  // Find matching genre category
  let fallbacks = GENRE_FALLBACKS.default;
  
  for (const [key, value] of Object.entries(GENRE_FALLBACKS)) {
    if (genreLower.includes(key)) {
      fallbacks = value;
      break;
    }
  }
  
  // Use title length as a simple hash to pick a varied phrase
  const index = (title?.length || 0) % fallbacks.length;
  return fallbacks[index];
}

// ==============================================
// ACTION RESULT TYPES
// ==============================================

export interface AutofillActionResult {
  success: boolean;
  data?: AutofillResponse;
  error?: string;
}

export interface PersuadeActionResult {
  success: boolean;
  data?: PersuadeResponse;
  error?: string;
}

// ==============================================
// AUTOFILL ACTION
// ==============================================

/**
 * Magic Autofill - Uses AI to generate media metadata from title
 * @param title - The title of the movie/series to autofill
 */
export async function actionAutofill(title: string): Promise<AutofillActionResult> {
  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: 'Please provide a title to autofill',
    };
  }

  if (!openai) {
    return {
      success: false,
      error: 'AI features are not configured. Please add OPENAI_API_KEY to enable autofill.',
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a movie database expert. Given a film title, return accurate information about it in JSON format.

Return ONLY a JSON object with these exact fields:
{
  "genre": "string - main genres separated by comma",
  "plot": "string - brief 1-2 sentence plot summary without spoilers",
  "cast": ["string array - top 3-4 main actors/actresses"],
  "duration": "string - runtime (e.g., '2h 15m')",
  "format": "movie",
  "year": number - release year,
  "found": boolean - true if you know this film, false if you don't recognize it
}

If you don't recognize the film or it's too recent (after your knowledge cutoff), set "found" to false and fill in reasonable placeholder values. Always set format to "movie".`,
        },
        {
          role: 'user',
          content: `Provide information for the film: "${title}"`,
        },
      ],
      max_completion_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return {
        success: false,
        error: 'No response received from AI',
      };
    }

    const parsedResponse = JSON.parse(responseContent);
    const validatedResponse = autofillResponseSchema.parse(parsedResponse);

    // Check if AI recognized the film
    if (validatedResponse.found === false) {
      return {
        success: false,
        error: 'Film not found in AI database. This might be a very recent release. Please fill in the details manually.',
      };
    }

    return {
      success: true,
      data: validatedResponse,
    };
  } catch (error) {
    console.error('Autofill error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid response format from AI',
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Failed to parse AI response',
      };
    }

    return {
      success: false,
      error: 'Failed to autofill. Please try again or enter details manually.',
    };
  }
}

// ==============================================
// PERSUADE ACTION
// ==============================================

/**
 * Generate a persuasive phrase to convince the user to watch
 * @param title - The title of the media
 * @param genre - The genre(s) of the media
 * @param plot - Brief plot summary
 */
export async function actionPersuade(
  title: string,
  genre: string,
  plot: string
): Promise<PersuadeActionResult> {
  if (!title) {
    return {
      success: false,
      error: 'Title is required',
    };
  }

  if (!openai) {
    // Return a fallback phrase if AI is not configured
    return {
      success: true,
      data: getGenreBasedFallback(genre, title),
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a charismatic film critic with a gift for convincing people to watch something. Generate a short, punchy persuasive phrase that would make someone excited to watch immediately.

Return ONLY a JSON object:
{
  "phrase": "string - A compelling 1-2 sentence persuasive pitch (max 100 chars). Be creative, witty, enthusiastic, and VARIED. Never repeat the same phrase. Examples: 'Trust me, you'll forget to breathe during the last 20 minutes.' or 'The kind of story that stays with you for weeks.' or 'Grab the tissues. You'll thank me later.' or 'This one hits different at 2am.' or 'The twist? You won't see it coming.' or 'Pure cinema magic from start to finish.'",
  "mood": "excited" | "intriguing" | "cozy" | "thrilling" - The vibe of the content,
  "emoji": "string - A single emoji that best represents this specific film based on its genre, mood, and plot. Examples: 🔪 for horror/thriller, 💕 for romance, 🚀 for sci-fi, 🦸 for superhero, 😂 for comedy, 🎄 for Christmas films, 🏎️ for action/racing, 🧙 for fantasy, 🎭 for drama, 👻 for supernatural, 🔫 for crime, 🌊 for adventure, 🤖 for robots/AI, 🦖 for dinosaurs, 🧟 for zombies, etc."
}

IMPORTANT: Be creative and never repeat the same phrase. Match the tone to the genre - thrillers should be intense, comedies light, dramas emotional. The emoji should be specific to the film's theme, not generic.`,
        },
        {
          role: 'user',
          content: `Generate a persuasive phrase for:
Title: "${title}"
Genre: ${genre || 'Unknown'}
Plot: ${plot || 'A captivating story'}`,
        },
      ],
      temperature: 0.95,
      max_tokens: 150,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return {
        success: false,
        error: 'No response received from AI',
      };
    }

    const parsedResponse = JSON.parse(responseContent);
    const validatedResponse = persuadeResponseSchema.parse(parsedResponse);

    return {
      success: true,
      data: validatedResponse,
    };
  } catch (error) {
    console.error('Persuade error:', error);

    // Fallback phrase if AI fails - use genre-based fallback
    return {
      success: true,
      data: getGenreBasedFallback(genre, title),
    };
  }
}
