'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Check, Film, Clock, X, Star, Globe, Tv, Plus } from 'lucide-react';
import { getRandomUnwatched, markAsWatched, updateMediaItem } from '@/lib/actions/media';
import type { SpinFilters } from '@/lib/actions/media';
import { StarRating, useToast } from '@/components/ui';
import { useMediaItems } from '@/hooks/useMediaItems';
import type { MediaItem } from '@/types/database';

// ==============================================
// LOADING PHRASES - Cinema Theme
// ==============================================

const LOADING_PHRASES = [
  "🎬 The projector is warming up...",
  "🍿 Preparing the perfect selection...",
  "🎭 Consulting the cinema gods...",
  "✨ Finding tonight's feature...",
  "🎥 Rolling through the archives...",
  "🌟 Destiny is loading...",
  "🎞️ Rewinding through your watchlist...",
  "🎪 The show is about to begin...",
  "🎫 Your ticket is being printed...",
  "🎬 And the winner is...",
];

// ==============================================
// DURATION OPTIONS
// ==============================================

const DURATION_OPTIONS = [
  { value: '', label: 'Any', emoji: '⏱️' },
  { value: '90', label: '≤1h30', emoji: '⚡' },
  { value: '120', label: '≤2h', emoji: '🎬' },
  { value: '150', label: '≤2h30', emoji: '🍿' },
];

// ==============================================
// GENRE EMOJIS
// ==============================================

const GENRE_EMOJIS: Record<string, string> = {
  'Action': '💥',
  'Adventure': '🌍',
  'Animation': '🎨',
  'Biography': '📖',
  'Comedy': '😂',
  'Crime': '🔫',
  'Documentary': '📹',
  'Drama': '🎭',
  'Family': '👨‍👩‍👧‍👦',
  'Fantasy': '🧙',
  'History': '🏛️',
  'Horror': '👻',
  'Music': '🎵',
  'Musical': '🎵',
  'Mystery': '🕵️',
  'Romance': '💕',
  'Science Fiction': '🚀',
  'Sci-Fi': '🚀',
  'Sport': '⚽',
  'Thriller': '🔍',
  'War': '⚔️',
  'Western': '🤠',
};

// ==============================================
// FORMAT ICONS
// ==============================================

const formatIcons = {
  movie: Film,
};

// ==============================================
// COMPONENT
// ==============================================

interface SlotMachineProps {
  onWatched?: () => void;
}

const MAX_SPINS = 3;

export function SlotMachine({ onWatched }: SlotMachineProps) {
  const { showToast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [spinCount, setSpinCount] = useState(0);
  const [shownFilmIds, setShownFilmIds] = useState<string[]>([]); // Track films shown in current spin session
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [watchedMedia, setWatchedMedia] = useState<MediaItem | null>(null);

  // Get media items to check if there are unwatched films
  const { mediaItems } = useMediaItems();
  const unwatchedItems = mediaItems.filter(item => item.status === 'unwatched');
  const unwatchedCount = unwatchedItems.length;
  const hasUnwatchedFilms = unwatchedCount > 0;

  // Helper to parse duration string to minutes
  const parseDurationToMinutes = (duration: string): number => {
    const hoursMatch = duration.match(/(\d+)\s*h/);
    const minutesMatch = duration.match(/(\d+)\s*m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
  };

  // Calculate available duration options based on unwatched films
  const availableDurationOptions = DURATION_OPTIONS.filter(option => {
    if (option.value === '') return true; // Always show "Any"
    const maxMinutes = parseInt(option.value);
    // Check if any unwatched film fits this duration
    return unwatchedItems.some(item => {
      if (!item.duration) return true; // Films without duration are considered available
      const filmMinutes = parseDurationToMinutes(item.duration);
      return filmMinutes <= maxMinutes;
    });
  });

  // Calculate available genres from unwatched films (reactive)
  // Split by comma or slash and trim each genre
  const availableGenres = [...new Set(
    unwatchedItems
      .flatMap(item => {
        if (!item.genre) return [];
        // Split by comma or slash and trim each genre
        return item.genre.split(/,|\//).map(g => g.trim()).filter(g => g.length > 0);
      })
  )].sort();

  // Helper to get emoji for a genre (case-insensitive matching)
  const getGenreEmoji = (genre: string): string => {
    // Direct match
    if (GENRE_EMOJIS[genre]) return GENRE_EMOJIS[genre];
    // Case-insensitive match
    const key = Object.keys(GENRE_EMOJIS).find(k => k.toLowerCase() === genre.toLowerCase());
    return key ? GENRE_EMOJIS[key] : '🎬';
  };

  // Helper to display genre name (shorten "Science Fiction" to "Sci-Fi")
  const displayGenreName = (genre: string): string => {
    if (genre.toLowerCase() === 'science fiction') return 'Sci-Fi';
    return genre;
  };

  // Reset selected genres if they're no longer available
  useEffect(() => {
    const validGenres = selectedGenres.filter(g => availableGenres.includes(g));
    if (validGenres.length !== selectedGenres.length) {
      setSelectedGenres(validGenres);
    }
  }, [availableGenres, selectedGenres]);

  // Animate through loading phrases
  const animatePhrases = useCallback(async () => {
    for (let i = 0; i < 8; i++) {
      const randomPhrase =
        LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
      setCurrentPhrase(randomPhrase);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, []);

  // Handle spin
  const handleSpin = useCallback(async () => {
    if (spinCount >= MAX_SPINS) return;
    
    setIsSpinning(true);
    setError(null);
    setSelectedMedia(null);

    // Start phrase animation
    const phraseAnimation = animatePhrases();

    // Build filters object
    const filters: SpinFilters = {};
    if (selectedGenres.length > 0) filters.genres = selectedGenres;
    if (selectedDuration) filters.maxDuration = parseInt(selectedDuration);
    if (shownFilmIds.length > 0) filters.excludeIds = shownFilmIds; // Exclude already shown films

    // Fetch random media with filters
    const result = await getRandomUnwatched(Object.keys(filters).length > 0 ? filters : undefined);

    // Wait for animation to complete
    await phraseAnimation;

    if (!result.success || !result.data) {
      setError(result.error || 'No media found');
      setIsSpinning(false);
      // Don't consume a spin if no film was found
      return;
    }

    // Only increment spin count on successful result
    setSpinCount(prev => prev + 1);

    const media = result.data as MediaItem;
    setSelectedMedia(media);
    setShownFilmIds(prev => [...prev, media.id]); // Add to shown films

    setIsSpinning(false);
  }, [animatePhrases, selectedGenres, selectedDuration, spinCount, shownFilmIds]);

  // Handle mark as watched
  const handleMarkWatched = useCallback(async () => {
    if (!selectedMedia) return;

    const result = await markAsWatched(selectedMedia.id);

    if (result.success) {
      showToast('Film marked as watched! 🎬', 'success');
      // Store the media for rating modal
      setWatchedMedia(selectedMedia);
      setShowRatingModal(true);
      
      setSelectedMedia(null);
      setSpinCount(0); // Reset spin count after watching
      setShownFilmIds([]); // Reset shown films
      setSelectedGenres([]); // Reset genre filter
      setSelectedDuration(''); // Reset duration filter
      onWatched?.();
    }
  }, [selectedMedia, onWatched, showToast]);

  // Handle rating from modal
  const handleRate = useCallback(async (rating: number) => {
    if (!watchedMedia) return;
    await updateMediaItem(watchedMedia.id, { user_rating: rating });
    showToast('Rating saved! ⭐', 'success');
    setShowRatingModal(false);
    setWatchedMedia(null);
  }, [watchedMedia, showToast]);

  // Handle skip rating
  const handleSkipRating = useCallback(() => {
    setShowRatingModal(false);
    setWatchedMedia(null);
  }, []);

  // Get format icon
  const FormatIcon = selectedMedia
    ? formatIcons[selectedMedia.format] || Film
    : Film;

  return (
    <div className="w-full max-w-2xl mx-auto" data-tour="slot-machine">
      {/* Main Card - iOS 26.2 Glass Design */}
      <div className="relative">
        {/* Screen - Ethereal Glass Container */}
        <motion.div 
          className="relative glass-heavy rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Volumetric Light Effect */}
          <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl" />
          
          {/* Dynamic Glow Based on State */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 ${
            selectedMedia ? 'bg-amber-500/10' : isSpinning ? 'bg-red-500/10' : 'bg-white/5'
          }`} />

        {/* Content */}
          <div className="relative z-10">
            {/* Title - Ethereal */}
            <div className="text-center mb-4 sm:mb-8">
              <motion.h2 
                className="text-base sm:text-xl md:text-2xl font-light tracking-wide text-white/90"
                animate={{ opacity: isSpinning ? 0.6 : 1 }}
              >
                {isSpinning ? '🎬 Rolling the reels...' : '🎟️ Ready for showtime?'}
              </motion.h2>
            </div>

          {/* Slot Display */}
            <div className="min-h-[160px] sm:min-h-[200px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isSpinning ? (
                  // Loading State - Ethereal Animation
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-4xl sm:text-6xl mb-4 sm:mb-6"
                    >
                      🎥
                    </motion.div>
                    <motion.p
                      key={currentPhrase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm sm:text-lg text-amber-400/80 font-light italic px-2"
                    >
                      {currentPhrase}
                    </motion.p>
                  </motion.div>
                ) : selectedMedia ? (
                  // Result State - Feature Presentation with Ethereal Styling
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center w-full"
                  >
                    {/* Format Badge - Glass style */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-zinc-500 text-sm flex items-center gap-2">
                        <span className="inline-block w-8 h-px bg-white/10" />
                        Tonight&apos;s Feature
                        <span className="inline-block w-8 h-px bg-white/10" />
                      </span>
                    </div>

                    {/* Poster - Enhanced with glow */}
                    {selectedMedia.poster_url && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, type: 'spring' }}
                        className="flex justify-center mb-3 sm:mb-4 relative"
                      >
                        {/* Ambient glow behind poster */}
                        <div 
                          className="absolute inset-0 blur-3xl opacity-30 -z-10"
                          style={{
                            backgroundImage: `url(${selectedMedia.poster_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <img
                          src={selectedMedia.poster_url}
                          alt={selectedMedia.title}
                          className="w-24 sm:w-32 md:w-40 lg:w-48 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50 border border-white/10"
                        />
                      </motion.div>
                    )}

                    {/* Title */}
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight px-1 sm:px-2"
                    >
                      {(() => {
                        const genreEmoji = selectedMedia.genre 
                          ? (GENRE_EMOJIS[selectedMedia.genre] || GENRE_EMOJIS[Object.keys(GENRE_EMOJIS).find(g => selectedMedia.genre?.toLowerCase().includes(g.toLowerCase())) || ''] || '🎬')
                          : '🎬';
                        return `${genreEmoji} ${selectedMedia.title} ${genreEmoji}`;
                      })()}
                    </motion.h3>

                    {/* Meta Info - Glass pills */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm mb-4 sm:mb-6 px-2"
                    >
                      {selectedMedia.year && (
                        <span className="px-3 py-1 glass rounded-full text-white/80">{selectedMedia.year}</span>
                      )}
                      {selectedMedia.duration && (
                        <span className="px-3 py-1 glass rounded-full text-white/80">{selectedMedia.duration}</span>
                      )}
                      {selectedMedia.genre && (
                        <span className="px-3 py-1 glass rounded-full text-white/80">{selectedMedia.genre}</span>
                      )}
                      {selectedMedia.original_language && (
                        <span className="px-3 py-1 glass rounded-full text-white/80 flex items-center gap-1 uppercase">
                          <Globe className="w-3 h-3" />
                          {selectedMedia.original_language}
                        </span>
                      )}
                    </motion.div>

                    {/* Plot */}
                    {selectedMedia.plot && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed"
                      >
                        {selectedMedia.plot}
                      </motion.p>
                    )}

                    {/* Cast */}
                    {selectedMedia.cast && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-zinc-500"
                    >
                      <span className="text-zinc-600">Starring: </span>
                      {Array.isArray(selectedMedia.cast) 
                        ? selectedMedia.cast.join(', ')
                        : selectedMedia.cast}
                    </motion.div>
                  )}

                  {/* Streaming Platforms - Glass style */}
                    {selectedMedia.watch_providers && selectedMedia.watch_providers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 pt-4 border-t border-white/[0.06]"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Tv className="w-3 h-3 text-zinc-500" />
                          <span className="text-xs text-zinc-500">Available on</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {selectedMedia.watch_providers.map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 glass rounded-xl"
                              title={provider.provider_name}
                            >
                              {provider.logo_path && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                  alt={provider.provider_name}
                                  className="w-5 h-5 rounded"
                                />
                              )}
                              <span className="text-xs text-white/80">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : error ? (
                  // Error State - Glass style
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="glass rounded-2xl p-6">
                      <p className="text-zinc-400 mb-4">{error}</p>
                    </div>
                  </motion.div>
                ) : (
                  // Empty State - Ethereal ready to spin
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <motion.div 
                      className="text-7xl mb-6"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🎬
                    </motion.div>
                    <p className="text-white/80 text-lg font-light">
                      Press the button to start the show
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">🍿 Grab your popcorn!</p>
                    {!hasUnwatchedFilms && (
                      <motion.div 
                        className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-amber-400 text-sm font-medium">
                          ⚠️ Add films to your watchlist first!
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4 mt-8">
              {/* Spin Counter - Glass pill */}
              {spinCount > 0 && spinCount < MAX_SPINS && (
                <motion.div 
                  className="text-sm text-amber-400 flex items-center gap-2 px-4 py-2 glass rounded-full"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>🎟️</span>
                  {MAX_SPINS - spinCount} ticket{MAX_SPINS - spinCount !== 1 ? 's' : ''} remaining
                </motion.div>
              )}

              {/* Filters Panel - Ethereal Glass Style */}
              {spinCount < MAX_SPINS && (
                <div className="flex flex-col items-center gap-3 w-full">
                  {/* Genre Pills - Glass style */}
                  {availableGenres.length > 0 && (
                    <div className="w-full">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Genre {selectedGenres.length > 0 && `(${selectedGenres.length})`}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x snap-mandatory">
                        <div className="flex gap-2 mx-auto">
                        <motion.button
                          onClick={() => setSelectedGenres([])}
                          disabled={isSpinning}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 px-3 py-2 text-sm rounded-full transition-all duration-200 snap-start ${
                            selectedGenres.length === 0
                              ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black font-medium shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                              : 'glass text-zinc-400'
                          } disabled:opacity-50`}
                        >
                          🎬 All
                        </motion.button>
                        {availableGenres.map((genre) => {
                          const isSelected = selectedGenres.includes(genre);
                          return (
                          <motion.button
                            key={genre}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGenres(selectedGenres.filter(g => g !== genre));
                              } else {
                                setSelectedGenres([...selectedGenres, genre]);
                              }
                            }}
                            disabled={isSpinning}
                            whileTap={{ scale: 0.95 }}
                            className={`flex-shrink-0 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full transition-all duration-200 snap-start ${
                              isSelected
                                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black font-medium shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                : 'glass text-zinc-400'
                            } disabled:opacity-50`}
                          >
                            {getGenreEmoji(genre)} {displayGenreName(genre)}
                          </motion.button>
                        )})}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration Pills - Glass style */}
                  {availableDurationOptions.length > 1 && (
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Duration</span>
                    </div>
                    <div className="flex gap-2 justify-center overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                      {availableDurationOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          onClick={() => setSelectedDuration(selectedDuration === option.value ? '' : option.value)}
                          disabled={isSpinning}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full transition-all duration-200 ${
                            selectedDuration === option.value
                              ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black font-medium shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                              : 'glass text-zinc-400'
                          } disabled:opacity-50`}
                        >
                          {option.emoji} {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Active Filters Summary - Glass style */}
                  {(selectedGenres.length > 0 || selectedDuration) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500"
                    >
                      <span>Filtering by:</span>
                      {selectedGenres.map(genre => (
                        <motion.span 
                          key={genre}
                          className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 cursor-pointer"
                          onClick={() => setSelectedGenres(selectedGenres.filter(g => g !== genre))}
                          whileTap={{ scale: 0.9 }}
                        >
                          {genre} ×
                        </motion.span>
                      ))}
                      {selectedDuration && (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                          {DURATION_OPTIONS.find(d => d.value === selectedDuration)?.label}
                        </span>
                      )}
                      <motion.button
                        onClick={() => { setSelectedGenres([]); setSelectedDuration(''); }}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
              {spinCount >= MAX_SPINS && selectedMedia ? (
                <>
                  {/* No more spins - Glass style message */}
                  <div className="w-full sm:w-auto text-center mb-3 sm:mb-0">
                    <motion.div 
                      className="inline-flex items-center gap-2 px-4 py-2.5 glass-heavy rounded-full"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <span className="text-amber-400 font-medium">🎟️ Out of tickets! Time to watch this one.</span>
                    </motion.div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMarkWatched}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-semibold text-base rounded-full transition-colors shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                  >
                    <Check className="w-5 h-5" />
                    <span>✅ Mark as Watched</span>
                  </motion.button>
                </>
              ) : selectedMedia ? (
                <>
                  {/* Spin Again - Glass button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 glass-heavy text-white text-base rounded-full transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>🎰 Spin Again</span>
                  </motion.button>

                  {/* Mark as Watched - Primary button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMarkWatched}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-semibold text-base rounded-full transition-colors shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                  >
                    <Check className="w-5 h-5" />
                    <span>✅ Watched</span>
                  </motion.button>
                </>
              ) : !hasUnwatchedFilms ? (
                /* Empty Watchlist State - Disabled glass button */
                <motion.button
                  disabled
                  className="w-full sm:w-auto group relative px-8 py-4 glass-heavy text-zinc-500 font-semibold rounded-full transition-all opacity-50 cursor-not-allowed overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-xl">🎬</span>
                    <span className="text-base">Roll the Film!</span>
                  </span>
                </motion.button>
              ) : (
                /* Main Spin Button - Cinema Red with Glow */
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-b from-red-500 to-red-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 overflow-hidden shadow-[0_0_25px_rgba(239,68,68,0.3)] glow-red"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-lg sm:text-xl">🎬</span>
                    <span className="text-sm sm:text-base">Roll the Film!</span>
                  </span>
                </motion.button>
              )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative dots - Subtle */}
      <div className="flex justify-center gap-1.5 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/[0.06]" />
        ))}
      </div>

      {/* Rating Modal - iOS 26.2 Ethereal Style */}
      <AnimatePresence>
        {showRatingModal && watchedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
            onClick={handleSkipRating}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-heavy rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm relative"
            >
              {/* Handle bar for mobile */}
              <div className="sm:hidden flex justify-center mb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Success Badge */}
              <div className="flex justify-center mb-4">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full flex items-center justify-center border border-emerald-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Check className="w-8 h-8 text-emerald-400" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-white text-center mb-2">
                🎬 {watchedMedia.title}
              </h2>
              <p className="text-sm text-emerald-400 text-center mb-6">
                Marked as watched!
              </p>

              {/* Reminder - Glass style */}
              <div className="glass rounded-xl p-4 mb-6">
                <p className="text-amber-400 text-sm text-center flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" />
                  Don&apos;t forget to rate this film!
                </p>
              </div>

              {/* Rating */}
              <div className="flex justify-center mb-6">
                <StarRating
                  value={null}
                  onChange={handleRate}
                  size="lg"
                  showLabel
                />
              </div>

              {/* Skip Button */}
              <motion.button
                onClick={handleSkipRating}
                className="w-full py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
                whileTap={{ scale: 0.98 }}
              >
                Skip for now
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
