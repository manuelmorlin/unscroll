'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, X, Loader2, Film } from 'lucide-react';
import { addMediaItem } from '@/lib/actions/media';
import { actionAutofill } from '@/lib/actions/ai';
import { searchMovies, getMovieDetails, type TMDBMovie, type WatchProvider } from '@/lib/actions/tmdb';
import { useToast } from '@/components/ui';
import { useMediaItems } from '@/hooks/useMediaItems';
import type { MediaItemInsert } from '@/types/database';

interface AddMediaFormProps {
  onSuccess?: () => void;
}

export function AddMediaForm({ onSuccess }: AddMediaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { mediaItems } = useMediaItems();

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [plot, setPlot] = useState('');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [duration, setDuration] = useState('');
  const [year, setYear] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [watchProviders, setWatchProviders] = useState<WatchProvider[]>([]);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  // Check if film is already in watchlist
  const isAlreadyInWatchlist = useCallback((filmTitle: string, filmYear?: number) => {
    const normalizedTitle = filmTitle.toLowerCase().trim();
    return mediaItems.some(item => {
      const itemTitle = item.title.toLowerCase().trim();
      // Match by title (and year if provided)
      if (filmYear && item.year) {
        return itemTitle === normalizedTitle && item.year === filmYear;
      }
      return itemTitle === normalizedTitle;
    });
  }, [mediaItems]);

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
    setOriginalLanguage('');
    setWatchProviders([]);
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
    setOriginalLanguage('');

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
        setOriginalLanguage(tmdbResult.data.original_language || '');
        setWatchProviders(tmdbResult.data.watch_providers || []);
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

      // Check if film is already in watchlist
      const filmYear = year ? parseInt(year) : undefined;
      if (isAlreadyInWatchlist(title, filmYear)) {
        setError('This film is already in your watchlist');
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
        original_language: originalLanguage || null,
        watch_providers: watchProviders.length > 0 ? watchProviders : null,
      };

      const result = await addMediaItem(mediaData);

      if (result.success) {
        resetForm();
        setIsOpen(false);
        showToast('Film added to watchlist');
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to add media');
      }

      setIsSubmitting(false);
    },
    [title, genre, plot, cast, duration, year, originalLanguage, resetForm, onSuccess, showToast, isAlreadyInWatchlist]
  );

  return (
    <>
      {/* Trigger Button - iOS 26.2 Style */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        data-tour="add-button"
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-b from-red-500 to-red-700 text-white rounded-full transition-colors shadow-[0_0_20px_rgba(239,68,68,0.25)] glow-red font-medium text-sm sm:text-base"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">🎬 Add Film</span>
        <span className="sm:hidden">🎬 Add</span>
      </motion.button>

      {/* Modal - iOS 26.2 Ethereal Style - Rendered via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 modal-backdrop z-[100]"
              />

              {/* Modal Content - Bottom Sheet on Mobile */}
              <div 
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
              >
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="pointer-events-auto w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] glass-heavy rounded-t-3xl sm:rounded-2xl overflow-hidden overflow-y-auto scrollbar-hide"
              >
              {/* Handle bar for mobile */}
              <div className="sm:hidden flex justify-center pt-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.06]">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  <span>🎟️</span> Add to Watchlist
                </h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Error */}
                {error && (
                  <motion.div 
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
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
                        className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                        </div>
                      )}
                      
                      {/* Suggestions Dropdown - Glass Style */}
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 glass-heavy rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-hide"
                          >
                            {suggestions.map((movie) => {
                              const movieYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined;
                              const alreadyAdded = isAlreadyInWatchlist(movie.title, movieYear);
                              return (
                              <motion.button
                                key={movie.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (!alreadyAdded) {
                                    handleSelectSuggestion(movie);
                                  }
                                }}
                                disabled={alreadyAdded}
                                whileTap={{ scale: alreadyAdded ? 1 : 0.98 }}
                                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-b border-white/[0.03] last:border-b-0 ${
                                  alreadyAdded 
                                    ? 'opacity-60 cursor-not-allowed bg-white/[0.02]' 
                                    : 'hover:bg-white/[0.05] active:bg-white/[0.08]'
                                }`}
                              >
                                {movie.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-10 h-14 object-cover rounded-lg border border-white/10"
                                  />
                                ) : (
                                  <div className="w-10 h-14 bg-white/[0.05] rounded-lg flex items-center justify-center border border-white/10">
                                    <Film className="w-5 h-5 text-zinc-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{movie.title}</p>
                                  <p className="text-sm text-zinc-500">
                                    {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown year'}
                                    {alreadyAdded && <span className="ml-2 text-amber-400">✓ In watchlist</span>}
                                  </p>
                                </div>
                              </motion.button>
                            )})}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAutofill}
                      disabled={isAutofilling || !title.trim()}
                      className="px-3 sm:px-4 py-3 bg-gradient-to-b from-amber-400 to-amber-600 text-black font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(251,191,36,0.2)]"
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
                      placeholder="e.g., Sci-Fi/Thriller"
                      className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
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
                      className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Duration & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">⏱️ Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 2h 28m"
                      className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">🌐 Language</label>
                    <input
                      type="text"
                      value={originalLanguage}
                      onChange={(e) => setOriginalLanguage(e.target.value)}
                      placeholder="e.g., en, it, ja"
                      className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600 uppercase"
                    />
                  </div>
                </div>

                {/* Cast */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">⭐ Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="e.g., Leonardo DiCaprio, Ellen Page"
                    className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
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
                    className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600 resize-none"
                  />
                </div>

                {/* Submit - Primary Cinematic Button */}
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-b from-red-500 to-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] glow-red"
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
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
