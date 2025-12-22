/**
 * Genre formatting utilities
 * - Max 2 genres
 * - Separated by /
 * - Common abbreviations applied
 */

// Genre name abbreviations (common short forms)
const genreAbbreviations: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'science fiction': 'Sci-Fi',
  'Documentary': 'Doc',
  'documentary': 'Doc',
  'Animation': 'Animated',
  'animation': 'Animated',
  'TV Movie': 'TV',
  'tv movie': 'TV',
};

/**
 * Format a genre string to the standard format: "Genre1/Genre2" (max 2)
 * Handles both comma-separated and slash-separated input
 */
export function formatGenre(genre: string | null | undefined): string {
  if (!genre) return '';
  
  // Split by comma or slash
  const genres = genre.split(/,|\//).map(g => g.trim()).filter(g => g.length > 0);
  
  // Apply abbreviations and take max 2
  return genres
    .slice(0, 2)
    .map(g => genreAbbreviations[g] || g)
    .join('/');
}

/**
 * Format an array of genre objects from TMDB to string
 */
export function formatGenresFromArray(genres: { id: number; name: string }[]): string {
  return genres
    .slice(0, 2)
    .map(g => genreAbbreviations[g.name] || g.name)
    .join('/');
}
