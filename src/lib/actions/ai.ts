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
    { phrase: "Keep the lights on for this one.", mood: 'thrilling', emoji: '👻' },
    { phrase: "Scary in the best way.", mood: 'thrilling', emoji: '🔪' },
    { phrase: "You might lose some sleep.", mood: 'thrilling', emoji: '💀' },
  ],
  thriller: [
    { phrase: "The ending will surprise you.", mood: 'thrilling', emoji: '🔍' },
    { phrase: "You won't be able to look away.", mood: 'thrilling', emoji: '😰' },
    { phrase: "Full of surprises.", mood: 'intriguing', emoji: '🎯' },
  ],
  comedy: [
    { phrase: "Get ready to laugh a lot.", mood: 'excited', emoji: '😂' },
    { phrase: "You'll smile the whole time.", mood: 'cozy', emoji: '🤣' },
    { phrase: "Feel-good film alert!", mood: 'excited', emoji: '😄' },
  ],
  romance: [
    { phrase: "Have tissues ready.", mood: 'cozy', emoji: '💕' },
    { phrase: "Your heart will thank you.", mood: 'cozy', emoji: '❤️' },
    { phrase: "A beautiful love story.", mood: 'intriguing', emoji: '💝' },
  ],
  action: [
    { phrase: "Non-stop fun from start to end.", mood: 'excited', emoji: '💥' },
    { phrase: "Action-packed and exciting.", mood: 'thrilling', emoji: '🔥' },
    { phrase: "Hold on tight!", mood: 'excited', emoji: '⚡' },
  ],
  'sci-fi': [
    { phrase: "Get ready to be amazed.", mood: 'intriguing', emoji: '🚀' },
    { phrase: "The future looks cool.", mood: 'excited', emoji: '🤖' },
    { phrase: "Mind-blowing stuff.", mood: 'intriguing', emoji: '🌌' },
  ],
  fantasy: [
    { phrase: "Magic and adventure await.", mood: 'excited', emoji: '🧙' },
    { phrase: "A world you'll love.", mood: 'cozy', emoji: '✨' },
    { phrase: "Epic and amazing.", mood: 'excited', emoji: '🐉' },
  ],
  drama: [
    { phrase: "A story that stays with you.", mood: 'intriguing', emoji: '🎭' },
    { phrase: "Beautiful and moving.", mood: 'intriguing', emoji: '💫' },
    { phrase: "You'll feel all the feelings.", mood: 'cozy', emoji: '🌟' },
  ],
  animation: [
    { phrase: "Beautiful animation, great story.", mood: 'excited', emoji: '🎨' },
    { phrase: "Fun for everyone.", mood: 'cozy', emoji: '✨' },
    { phrase: "Looks amazing.", mood: 'excited', emoji: '🌈' },
  ],
  christmas: [
    { phrase: "Perfect for the holidays.", mood: 'cozy', emoji: '🎄' },
    { phrase: "Grab some hot cocoa.", mood: 'cozy', emoji: '☃️' },
    { phrase: "Holiday vibes!", mood: 'cozy', emoji: '🎅' },
  ],
  default: [
    { phrase: "This one is special.", mood: 'intriguing', emoji: '⭐' },
    { phrase: "A great watch.", mood: 'excited', emoji: '🎬' },
    { phrase: "You should watch this.", mood: 'excited', emoji: '🍿' },
    { phrase: "You won't regret it.", mood: 'intriguing', emoji: '🎥' },
    { phrase: "Trust me on this one.", mood: 'cozy', emoji: '✨' },
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
          content: `You convince people to watch films. Write a short, fun phrase that makes them want to watch now.

Return ONLY a JSON object:
{
  "phrase": "string - A short sentence (max 80 chars). Use simple words. Be fun and direct. Examples: 'You will love every minute of this.' or 'Get ready for a wild ride.' or 'This one will make you cry (in a good way).' or 'Perfect for a cozy night in.' or 'The ending will surprise you.'",
  "mood": "excited" | "intriguing" | "cozy" | "thrilling",
  "emoji": "string - One emoji for the film. Examples: 🔪 horror, 💕 romance, 🚀 sci-fi, 😂 comedy, 🎄 Christmas, 🧙 fantasy, 🎭 drama, 👻 scary"
}

Use simple English. Keep it short. Match the mood to the genre.`,
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

// ==============================================
// SMART REVIEW GENERATOR
// ==============================================

const reviewResponseSchema = z.object({
  review: z.string(),
  style: z.enum(['casual', 'critic', 'poetic', 'humorous']),
});

export interface ReviewActionResult {
  success: boolean;
  data?: { review: string; style: string };
  error?: string;
}

/**
 * Generate a smart review based on user's rating and keywords
 */
export async function actionGenerateReview(
  title: string,
  rating: number,
  keywords: string[],
  style: 'casual' | 'critic' | 'poetic' | 'humorous' = 'casual'
): Promise<ReviewActionResult> {
  if (!title || rating === undefined) {
    return { success: false, error: 'Title and rating are required' };
  }

  if (!openai) {
    // Fallback reviews based on rating
    const fallbacks: Record<number, string[]> = {
      5: ["Loved every minute. One of my favorites now.", "Amazing film. Everyone should see this."],
      4: ["Really liked this one. Would watch again.", "Great film with some really good moments."],
      3: ["It was okay. Some good parts, some slow.", "Worth watching once if you like this type."],
      2: ["Not for me. Had some good ideas but missed.", "Expected more. Kind of boring."],
      1: ["Hard to finish. Would not recommend.", "Not good. Save your time."],
    };
    const ratingKey = Math.round(rating) as 1 | 2 | 3 | 4 | 5;
    const options = fallbacks[ratingKey] || fallbacks[3];
    return {
      success: true,
      data: { review: options[Math.floor(Math.random() * options.length)], style },
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You write short film reviews. Write 1-2 simple sentences (max 150 characters).

Writing styles:
- casual: Like talking to a friend
- critic: More serious, about the film quality
- poetic: Beautiful words, emotional
- humorous: Funny and playful

Return ONLY a JSON object:
{
  "review": "string - the review",
  "style": "string - the style used"
}

Use simple English words. Match tone to rating: 5★ = loved it, 4★ = liked it, 3★ = it was okay, 2★ = didn't like it, 1★ = bad.`,
        },
        {
          role: 'user',
          content: `Generate a ${style} review for:
Film: "${title}"
Rating: ${rating}/5 stars
${keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''}`,
        },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, error: 'No response from AI' };
    }

    const parsed = JSON.parse(responseContent);
    const validated = reviewResponseSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    console.error('Review generation error:', error);
    return { success: false, error: 'Failed to generate review' };
  }
}

// ==============================================
// WHAT TO WATCH NEXT (RECOMMENDATIONS)
// ==============================================

interface FilmData {
  title: string;
  genre: string | null;
  rating: number | null;
  year: number | null;
}

const recommendationsSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    year: z.number().optional(),
    reason: z.string(),
    matchScore: z.number().min(1).max(100),
  })).max(5),
  analysis: z.string(),
});

export interface RecommendationsResult {
  success: boolean;
  data?: {
    recommendations: Array<{ title: string; year?: number; reason: string; matchScore: number }>;
    analysis: string;
  };
  error?: string;
}

/**
 * Get AI-powered movie recommendations based on watched films
 */
export async function actionGetRecommendations(
  watchedFilms: FilmData[],
  excludeTitles: string[] = []
): Promise<RecommendationsResult> {
  if (!watchedFilms || watchedFilms.length === 0) {
    return { success: false, error: 'No watched films provided' };
  }

  if (!openai) {
    return {
      success: false,
      error: 'AI features require OPENAI_API_KEY configuration',
    };
  }

  // Only send top-rated films to reduce token usage
  const topFilms = watchedFilms
    .filter(f => f.rating && f.rating >= 3)
    .slice(0, 20);

  if (topFilms.length === 0) {
    return { success: false, error: 'Rate some films first to get recommendations' };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You suggest films to watch. Based on what the user liked, suggest 5 films they might enjoy.

Return ONLY a JSON object:
{
  "recommendations": [
    {
      "title": "Film Title",
      "year": 2020,
      "reason": "Because you liked [Film Name] - short reason why it's similar",
      "matchScore": 85
    }
  ],
  "analysis": "What kind of films they seem to like (1 simple sentence)"
}

Rules:
- Only suggest real films
- Don't suggest films from the exclude list
- Mix popular films and hidden gems
- Use simple English
- IMPORTANT: Always start reason with "Because you liked [Film Name]" or "Because you watched [Film Name]" - reference a specific film from their list that connects to your suggestion`,
        },
        {
          role: 'user',
          content: `Based on these rated films, recommend 5 new films:

${topFilms.map(f => `- ${f.title} (${f.year || 'unknown'}) - ${f.rating}★ - ${f.genre || 'unknown genre'}`).join('\n')}

Exclude these titles: ${excludeTitles.join(', ') || 'none'}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 600,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, error: 'No response from AI' };
    }

    const parsed = JSON.parse(responseContent);
    const validated = recommendationsSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    console.error('Recommendations error:', error);
    return { success: false, error: 'Failed to get recommendations' };
  }
}

// ==============================================
// AI WRAPPED INSIGHTS
// ==============================================

interface WrappedData {
  totalFilms: number;
  totalHours: number;
  topGenres: string[];
  topDirectors: string[];
  avgRating: number;
  topRatedFilms: string[];
  mostWatchedMonth: string;
  favoriteLanguage: string;
}

const wrappedInsightsSchema = z.object({
  personality: z.string(),
  spiritAnimal: z.object({
    director: z.string(),
    reason: z.string(),
  }),
  prediction2026: z.string(),
  roast: z.string(),
  compliment: z.string(),
});

export interface WrappedInsightsResult {
  success: boolean;
  data?: {
    personality: string;
    spiritAnimal: { director: string; reason: string };
    prediction2026: string;
    roast: string;
    compliment: string;
  };
  error?: string;
}

/**
 * Generate AI insights for the year-end Wrapped
 */
export async function actionGetWrappedInsights(
  data: WrappedData
): Promise<WrappedInsightsResult> {
  if (!data || data.totalFilms === 0) {
    return { success: false, error: 'No film data provided' };
  }

  if (!openai) {
    // Fallback insights
    return {
      success: true,
      data: {
        personality: `You watched ${data.totalFilms} films this year. That's a lot of movie nights! Your taste is special.`,
        spiritAnimal: {
          director: 'Christopher Nolan',
          reason: 'You like films that make you think and look amazing',
        },
        prediction2026: "You'll find a new favorite director and watch some old classics again.",
        roast: "Your watchlist is longer than your free time. But hey, dreams are free!",
        compliment: "You really love films and it shows. Keep watching!",
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
          content: `You create fun film year summaries. Be friendly and playful. Use simple English.

Return ONLY a JSON object:
{
  "personality": "2 simple sentences about what kind of film fan they are",
  "spiritAnimal": {
    "director": "A director that fits their taste",
    "reason": "Why this director fits them (simple sentence)"
  },
  "prediction2026": "A fun guess about their 2026 film watching (simple sentence)",
  "roast": "A friendly joke about their film habits (keep it nice and simple!)",
  "compliment": "Something nice about their film taste (simple sentence)"
}`,
        },
        {
          role: 'user',
          content: `Generate Wrapped insights for this user:
- Films watched: ${data.totalFilms}
- Hours watched: ${Math.round(data.totalHours)}
- Top genres: ${data.topGenres.join(', ') || 'varied'}
- Top directors: ${data.topDirectors.join(', ') || 'varied'}
- Average rating: ${data.avgRating.toFixed(1)}
- Top rated films: ${data.topRatedFilms.join(', ') || 'varied'}
- Busiest month: ${data.mostWatchedMonth}
- Favorite language: ${data.favoriteLanguage || 'English'}`,
        },
      ],
      temperature: 0.95,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, error: 'No response from AI' };
    }

    const parsed = JSON.parse(responseContent);
    const validated = wrappedInsightsSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    console.error('Wrapped insights error:', error);
    return { success: false, error: 'Failed to generate insights' };
  }
}

// ==============================================
// TASTE ANALYSIS
// ==============================================

interface TasteData {
  films: Array<{
    title: string;
    genre: string | null;
    rating: number | null;
    year: number | null;
    duration: string | null;
    director: string | null;
    language: string | null;
  }>;
}

const tasteAnalysisSchema = z.object({
  dna: z.string(),
  patterns: z.array(z.string()).max(5),
  filmSoulmate: z.object({
    director: z.string(),
    reason: z.string(),
  }),
  blindSpots: z.array(z.string()).max(3),
  quirks: z.array(z.string()).max(3),
  criticScore: z.number().min(1).max(100),
  mainstreamScore: z.number().min(1).max(100),
});

export interface TasteAnalysisResult {
  success: boolean;
  data?: {
    dna: string;
    patterns: string[];
    filmSoulmate: { director: string; reason: string };
    blindSpots: string[];
    quirks: string[];
    criticScore: number;
    mainstreamScore: number;
  };
  error?: string;
}

/**
 * Analyze user's film taste in depth
 */
export async function actionAnalyzeTaste(
  data: TasteData
): Promise<TasteAnalysisResult> {
  if (!data?.films || data.films.length < 5) {
    return { success: false, error: 'Need at least 5 watched films for taste analysis' };
  }

  if (!openai) {
    return {
      success: false,
      error: 'AI features require OPENAI_API_KEY configuration',
    };
  }

  // Prepare summary stats
  const ratedFilms = data.films.filter(f => f.rating);
  const avgRating = ratedFilms.length > 0
    ? ratedFilms.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFilms.length
    : 0;

  const genres = data.films.flatMap(f => f.genre?.split(/,|\//).map(g => g.trim()) || []);
  const genreCounts: Record<string, number> = {};
  genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const directors = data.films.filter(f => f.director).map(f => f.director!);
  const directorCounts: Record<string, number> = {};
  directors.forEach(d => { directorCounts[d] = (directorCounts[d] || 0) + 1; });
  const topDirectors = Object.entries(directorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You analyze someone's film taste and talk directly to them. Use "you" and "your". Use simple English.

Return ONLY a JSON object:
{
  "dna": "2-3 simple sentences about what makes YOUR film taste special (talk to the user directly)",
  "patterns": ["Pattern 1", "Pattern 2", ...], // Up to 5 things you notice about what YOU watch
  "filmSoulmate": {
    "director": "Director name",
    "reason": "Why this director fits YOUR taste (simple sentence, talk to user)"
  },
  "blindSpots": ["Thing you might be missing", ...], // Types of films YOU don't watch, up to 3
  "quirks": ["Interesting thing about you", ...], // Fun things about YOUR taste, up to 3
  "criticScore": 75, // 1-100, how hard YOU rate films (100 = very strict)
  "mainstreamScore": 50 // 1-100, popular films vs rare films
}

Always use "you" and "your". Be friendly and use simple words.`,
        },
        {
          role: 'user',
          content: `Analyze this film collection:

Total films: ${data.films.length}
Average rating: ${avgRating.toFixed(1)}/5
Top genres: ${topGenres.map(([g, c]) => `${g} (${c})`).join(', ')}
Top directors: ${topDirectors.map(([d, c]) => `${d} (${c} films)`).join(', ')}

Sample of films (with ratings):
${data.films.slice(0, 25).map(f => 
  `- ${f.title} (${f.year || '?'}) | ${f.genre || 'unknown'} | ${f.rating ? f.rating + '★' : 'unrated'} | Dir: ${f.director || 'unknown'}`
).join('\n')}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 700,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, error: 'No response from AI' };
    }

    const parsed = JSON.parse(responseContent);
    const validated = tasteAnalysisSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    console.error('Taste analysis error:', error);
    return { success: false, error: 'Failed to analyze taste' };
  }
}
