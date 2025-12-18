'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, X, Loader2, Film } from 'lucide-react';
import { addMediaItem } from '@/lib/actions/media';
import { actionAutofill } from '@/lib/actions/ai';
import { searchMovies, getMovieDetails, type TMDBMovie } from '@/lib/actions/tmdb';
import type { MediaItemInsert } from '@/types/database';

interface AddMediaFormProps {
  onSuccess?: () => void;
}

export function AddMediaForm({ onSuccess }: AddMediaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [plot, setPlot] = useState('');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [duration, setDuration] = useState('');
  const [year, setYear] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<TMDBMovie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('');
    setGenre('');
    setPlot('');
    setCast('');
    setDirector('');
    setDuration('');
    setYear('');
    setPosterUrl('');
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedTmdbId(null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search movies when title changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Skip search if we just selected a suggestion
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    // Clear TMDB ID and other fields when user types manually
    setSelectedTmdbId(null);
    setGenre('');
    setPlot('');
    setCast('');
    setDuration('');
    setYear('');
    setPosterUrl('');

    if (title.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const result = await searchMovies(title);
      if (result.success && result.movies) {
        setSuggestions(result.movies);
        setShowSuggestions(result.movies.length > 0);
      }
      setIsSearching(false);
    }, 300); // Debounce 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [title]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (movie: TMDBMovie) => {
    justSelectedRef.current = true;
    setTitle(movie.title);
    setSelectedTmdbId(movie.id);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle autofill - use TMDB if available, otherwise AI
  const handleAutofill = useCallback(async () => {
    if (!title.trim()) {
      setError('Enter a title first');
      return;
    }

    setIsAutofilling(true);
    setError(null);
    setShowSuggestions(false);

    let tmdbId = selectedTmdbId;

    // If no TMDB ID, search for the movie first
    if (!tmdbId) {
      const searchResult = await searchMovies(title);
      if (searchResult.success && searchResult.movies && searchResult.movies.length > 0) {
        // Use the first (best) match
        tmdbId = searchResult.movies[0].id;
      }
    }

    // If we have a TMDB ID (either selected or found), use TMDB for details
    if (tmdbId) {
      const tmdbResult = await getMovieDetails(tmdbId);
      
      if (tmdbResult.success && tmdbResult.data) {
        setGenre(tmdbResult.data.genre);
        setPlot(tmdbResult.data.plot);
        setCast(tmdbResult.data.cast.join(', '));
        setDirector(tmdbResult.data.director || '');
        setDuration(tmdbResult.data.duration);
        setYear(tmdbResult.data.year.toString());
        setPosterUrl(tmdbResult.data.poster_url || '');
        setIsAutofilling(false);
        return;
      }
    }

    // Fallback to AI only if TMDB didn't find anything
    const result = await actionAutofill(title);

    if (result.success && result.data) {
      setGenre(result.data.genre);
      setPlot(result.data.plot);
      setCast(result.data.cast.join(', '));
      setDuration(result.data.duration);
      setYear(result.data.year.toString());
    } else {
      setError(result.error || 'Autofill failed');
    }

    setIsAutofilling(false);
  }, [title, selectedTmdbId]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const mediaData: MediaItemInsert = {
        title: title.trim(),
        genre: genre || null,
        plot: plot || null,
        cast: cast ? cast.split(',').map((c) => c.trim()) : null,
        director: director || null,
        duration: duration || null,
        format: 'movie',
        year: year ? parseInt(year) : null,
        poster_url: posterUrl || null,
      };

      const result = await addMediaItem(mediaData);

      if (result.success) {
        resetForm();
        setIsOpen(false);
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to add media');
      }

      setIsSubmitting(false);
    },
    [title, genre, plot, cast, duration, year, resetForm, onSuccess]
  );

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-full transition-colors shadow-lg shadow-red-900/30 border border-red-500/30"
      >
        <Plus className="w-4 h-4" />
        <span>🎬 Add Film</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[max(5%,env(safe-area-inset-top))] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-zinc-900 border border-red-900/30 rounded-2xl z-50 overflow-hidden max-h-[85vh] overflow-y-auto shadow-2xl shadow-red-900/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-red-900/30 bg-gradient-to-r from-zinc-900 to-zinc-950">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>🎟️</span> Add to Watchlist
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Title + Autofill */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">🎬 Title *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="e.g., Inception"
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                        </div>
                      )}
                      
                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-1 bg-zinc-900 border border-red-900/30 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                          >
                            {suggestions.map((movie) => (
                              <button
                                key={movie.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectSuggestion(movie);
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-900/20 transition-colors text-left"
                              >
                                {movie.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-10 h-14 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-14 bg-zinc-700 rounded flex items-center justify-center">
                                    <Film className="w-5 h-5 text-zinc-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{movie.title}</p>
                                  <p className="text-sm text-zinc-400">
                                    {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown year'}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAutofill}
                      disabled={isAutofilling || !title.trim()}
                      className="px-3 sm:px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                    >
                      {isAutofilling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="text-sm sm:text-base">Autofill</span>
                    </motion.button>
                  </div>
                </div>

                {/* Genre & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">🎭 Genre</label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g., Sci-Fi, Thriller"
                      className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">📅 Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2010"
                      min="1800"
                      max="2100"
                      className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">⏱️ Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 2h 28m"
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Cast */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">⭐ Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="e.g., Leonardo DiCaprio, Ellen Page"
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Plot */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">📝 Plot</label>
                  <textarea
                    value={plot}
                    onChange={(e) => setPlot(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-red-900/30 border border-red-500/30"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>🎬</span>
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
