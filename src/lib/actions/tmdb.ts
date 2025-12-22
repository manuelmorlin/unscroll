'use server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  original_language: string;
}

export interface TMDBCredits {
  cast: { id: number; name: string; character: string; order: number }[];
  crew: { id: number; name: string; job: string; department: string }[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface MovieDetailsResult {
  success: boolean;
  data?: {
    genre: string;
    plot: string;
    cast: string[];
    director: string | null;
    duration: string;
    year: number;
    poster_url: string | null;
    original_language: string;
    watch_providers: WatchProvider[];
  };
  error?: string;
}

export interface SearchMoviesResult {
  success: boolean;
  movies?: TMDBMovie[];
  error?: string;
}

/**
 * Search for movies by title using TMDB API
 */
export async function searchMovies(query: string): Promise<SearchMoviesResult> {
  if (!query || query.trim().length < 2) {
    return { success: true, movies: [] };
  }

  if (!TMDB_API_KEY) {
    return {
      success: false,
      error: 'TMDB API key not configured',
    };
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    interface TMDBApiMovie {
      id: number;
      title: string;
      release_date?: string;
      poster_path: string | null;
      overview?: string;
    }

    const movies: TMDBMovie[] = data.results.slice(0, 8).map((movie: TMDBApiMovie) => ({
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date || '',
      poster_path: movie.poster_path,
      overview: movie.overview || '',
    }));

    return { success: true, movies };
  } catch (error) {
    console.error('TMDB search error:', error);
    return {
      success: false,
      error: 'Failed to search movies',
    };
  }
}

/**
 * Get full movie details from TMDB by ID
 */
export async function getMovieDetails(movieId: number): Promise<MovieDetailsResult> {
  if (!TMDB_API_KEY) {
    return {
      success: false,
      error: 'TMDB API key not configured',
    };
  }

  try {
    // Fetch movie details, credits, and watch providers in parallel
    const [detailsRes, creditsRes, providersRes] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`,
        { next: { revalidate: 86400 } } // Cache for 24 hours
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`,
        { next: { revalidate: 86400 } }
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 86400 } }
      ),
    ]);

    if (!detailsRes.ok || !creditsRes.ok) {
      throw new Error('TMDB API error');
    }

    const details: TMDBMovieDetails = await detailsRes.json();
    const credits: TMDBCredits = await creditsRes.json();
    
    // Parse watch providers (use IT region, fallback to US)
    let watchProviders: WatchProvider[] = [];
    if (providersRes.ok) {
      const providersData = await providersRes.json();
      const regionData = providersData.results?.IT || providersData.results?.US;
      if (regionData?.flatrate) {
        watchProviders = regionData.flatrate.map((p: { provider_id: number; provider_name: string; logo_path: string }) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));
      }
    }

    // Format duration
    const hours = details.runtime ? Math.floor(details.runtime / 60) : 0;
    const minutes = details.runtime ? details.runtime % 60 : 0;
    const duration = details.runtime 
      ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
      : '';

    // Get all cast members (sorted by billing order)
    const cast = credits.cast
      .sort((a, b) => a.order - b.order)
      .map(actor => actor.name);

    // Get director
    const director = credits.crew.find(member => member.job === 'Director')?.name || null;

    // Genre name abbreviations (common short forms)
    const genreAbbreviations: Record<string, string> = {
      'Science Fiction': 'Sci-Fi',
      'Documentary': 'Doc',
      'Animation': 'Animated',
      'TV Movie': 'TV',
    };

    // Get genres with abbreviations, joined by "/" (max 2 genres)
    const genre = details.genres
      .slice(0, 2)
      .map(g => genreAbbreviations[g.name] || g.name)
      .join('/');

    // Get year from release date
    const year = details.release_date 
      ? parseInt(details.release_date.split('-')[0], 10)
      : new Date().getFullYear();

    // Build poster URL
    const poster_url = details.poster_path
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : null;

    return {
      success: true,
      data: {
        genre,
        plot: details.overview || '',
        cast,
        director,
        duration,
        year,
        poster_url,
        original_language: details.original_language,
        watch_providers: watchProviders,
      },
    };
  } catch (error) {
    console.error('TMDB details error:', error);
    return {
      success: false,
      error: 'Failed to get movie details',
    };
  }
}

/**
 * Get popular movies from TMDB for background decoration
 */
export interface PopularMoviesResult {
  success: boolean;
  posters?: string[];
  error?: string;
}

export async function getPopularMoviePosters(): Promise<PopularMoviesResult> {
  if (!TMDB_API_KEY) {
    return { success: false, error: 'TMDB API key not configured' };
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    interface TMDBPopularMovie {
      poster_path: string | null;
    }

    // Get first 20 movies with posters
    const posters: string[] = data.results
      .filter((movie: TMDBPopularMovie) => movie.poster_path)
      .slice(0, 20)
      .map((movie: TMDBPopularMovie) => `https://image.tmdb.org/t/p/w342${movie.poster_path}`);

    return { success: true, posters };
  } catch (error) {
    console.error('TMDB popular error:', error);
    return { success: false, error: 'Failed to get popular movies' };
  }
}
