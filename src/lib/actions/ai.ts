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
});

const persuadeResponseSchema = z.object({
  phrase: z.string(),
  mood: z.enum(['excited', 'intriguing', 'cozy', 'thrilling']),
});

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
  "year": number - release year
}

Always set format to "movie". Be accurate and factual.`,
        },
        {
          role: 'user',
          content: `Provide information for the film: "${title}"`,
        },
      ],
      max_completion_tokens: 4000,
    });

    console.log('OpenAI response:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      console.error('No content in response. Full response:', completion);
      return {
        success: false,
        error: 'No response received from AI',
      };
    }

    const parsedResponse = JSON.parse(responseContent);
    const validatedResponse = autofillResponseSchema.parse(parsedResponse);

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
      data: {
        phrase: "Fate has chosen. Time to watch!",
        mood: 'excited',
      },
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
  "phrase": "string - A compelling 1-2 sentence persuasive pitch (max 100 chars). Be creative, witty, and enthusiastic. Examples: 'Trust me, you'll forget to breathe during the last 20 minutes.' or 'The kind of story that stays with you for weeks.'",
  "mood": "excited" | "intriguing" | "cozy" | "thrilling" - The vibe of the content
}

Match the tone to the genre - thrillers should be intense, comedies light, dramas emotional.`,
        },
        {
          role: 'user',
          content: `Generate a persuasive phrase for:
Title: "${title}"
Genre: ${genre || 'Unknown'}
Plot: ${plot || 'A captivating story'}`,
        },
      ],
      temperature: 0.8,
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

    // Fallback phrase if AI fails
    return {
      success: true,
      data: {
        phrase: "You picked this for a reason. Time to find out why.",
        mood: 'intriguing',
      },
    };
  }
}
