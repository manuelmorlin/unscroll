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
      5: ["An absolute masterpiece. One of the best films I've ever seen.", "Perfection. This is why I love cinema."],
      4: ["Really enjoyed this one. Highly recommended.", "Great film with memorable moments."],
      3: ["Decent watch. Has its moments but nothing special.", "It was okay. Worth a watch if you're into the genre."],
      2: ["Not my cup of tea. Had potential but fell flat.", "Disappointing. Expected more from this one."],
      1: ["Struggled to finish. Not recommended.", "Save your time. This one misses the mark completely."],
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
          content: `You are a film reviewer. Generate a short, personal movie review (2-3 sentences, max 200 characters) based on the user's rating and optional keywords.

Writing styles:
- casual: Friendly, conversational, like texting a friend
- critic: Professional, analytical, uses film terminology
- poetic: Lyrical, metaphorical, emotionally evocative
- humorous: Witty, playful, uses clever wordplay

Return ONLY a JSON object:
{
  "review": "string - the review text",
  "style": "string - the style used"
}

Match the tone to the rating: 5★ = enthusiastic, 4★ = positive, 3★ = balanced, 2★ = disappointed, 1★ = critical.`,
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
          content: `You are a film recommendation expert. Based on the user's watched and rated films, suggest 5 films they would likely enjoy that they haven't seen yet.

Return ONLY a JSON object:
{
  "recommendations": [
    {
      "title": "Film Title",
      "year": 2020,
      "reason": "Why they'll love it (1 sentence)",
      "matchScore": 85
    }
  ],
  "analysis": "Brief analysis of their taste (1-2 sentences)"
}

Rules:
- Recommend REAL films only
- Don't recommend films from the exclude list
- Match recommendations to their apparent taste patterns
- Higher matchScore = better fit (50-100 range)
- Vary recommendations: mix popular and hidden gems`,
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
        personality: `A dedicated cinephile who watched ${data.totalFilms} films this year. Your taste is uniquely yours!`,
        spiritAnimal: {
          director: 'Christopher Nolan',
          reason: 'You appreciate complex storytelling and visual spectacle',
        },
        prediction2026: "You'll discover a new favorite director and rewatch at least one classic.",
        roast: "Your watchlist is longer than your attention span. But hey, at least you have goals!",
        compliment: "Your commitment to cinema is inspiring. Keep exploring!",
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
          content: `You are a witty film analyst creating personalized Wrapped insights. Be creative, fun, and slightly playful.

Return ONLY a JSON object:
{
  "personality": "A 2-sentence personality description based on their film taste",
  "spiritAnimal": {
    "director": "Name of a director that matches their vibe",
    "reason": "Why this director matches them (1 sentence)"
  },
  "prediction2026": "A fun prediction for their 2026 film journey (1 sentence)",
  "roast": "A playful, friendly roast about their film habits (1 sentence, keep it light!)",
  "compliment": "A genuine compliment about their film taste (1 sentence)"
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
          content: `You are a film taste analyst. Analyze the user's viewing history and provide deep insights.

Return ONLY a JSON object:
{
  "dna": "2-3 sentence description of their 'Cinematic DNA' - their unique taste profile",
  "patterns": ["Pattern 1", "Pattern 2", ...], // Up to 5 hidden patterns in their viewing
  "filmSoulmate": {
    "director": "Director name",
    "reason": "Why this director matches their taste"
  },
  "blindSpots": ["Blind spot 1", ...], // Genres/types they're missing, up to 3
  "quirks": ["Quirk 1", ...], // Unique/interesting aspects of their taste, up to 3
  "criticScore": 75, // 1-100, how critical they are (100 = very harsh rater)
  "mainstreamScore": 50 // 1-100, how mainstream vs niche their taste is
}

Be specific, insightful, and occasionally witty.`,
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
