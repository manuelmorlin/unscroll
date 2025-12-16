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

    const movies: TMDBMovie[] = data.results.slice(0, 8).map((movie: any) => ({
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
