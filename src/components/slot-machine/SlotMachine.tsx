'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Check, Film, Clock, X } from 'lucide-react';
import { getRandomUnwatched, markAsWatched, getAllGenres } from '@/lib/actions/media';
import type { SpinFilters } from '@/lib/actions/media';
import { actionPersuade } from '@/lib/actions/ai';
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [persuasivePhrase, setPersuasivePhrase] = useState<string | null>(null);
  const [movieEmoji, setMovieEmoji] = useState<string>('🎬');
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [spinCount, setSpinCount] = useState(0);
  const [shownFilmIds, setShownFilmIds] = useState<string[]>([]); // Track films shown in current spin session

  // Load genres function
  const loadGenres = useCallback(async () => {
    const result = await getAllGenres();
    if (result.success && result.data) {
      setGenres(result.data as string[]);
      // Reset selected genre if it's no longer available
      const newGenres = result.data as string[];
      if (selectedGenre && !newGenres.includes(selectedGenre)) {
        setSelectedGenre('');
      }
    }
  }, [selectedGenre]);

  // Load genres on mount
  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

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
    setPersuasivePhrase(null);
    setSpinCount(prev => prev + 1);

    // Start phrase animation
    const phraseAnimation = animatePhrases();

    // Build filters object
    const filters: SpinFilters = {};
    if (selectedGenre) filters.genre = selectedGenre;
    if (selectedDuration) filters.maxDuration = parseInt(selectedDuration);
    if (shownFilmIds.length > 0) filters.excludeIds = shownFilmIds; // Exclude already shown films

    // Fetch random media with filters
    const result = await getRandomUnwatched(Object.keys(filters).length > 0 ? filters : undefined);

    // Wait for animation to complete
    await phraseAnimation;

    if (!result.success || !result.data) {
      setError(result.error || 'No media found');
      setIsSpinning(false);
      return;
    }

    const media = result.data as MediaItem;
    setSelectedMedia(media);
    setShownFilmIds(prev => [...prev, media.id]); // Add to shown films

    // Generate persuasive phrase
    const persuadeResult = await actionPersuade(
      media.title,
      media.genre || '',
      media.plot || ''
    );

    if (persuadeResult.success && persuadeResult.data) {
      setPersuasivePhrase(persuadeResult.data.phrase);
      setMovieEmoji(persuadeResult.data.emoji || '🎬');
    }

    setIsSpinning(false);
  }, [animatePhrases, selectedGenre, selectedDuration, spinCount, shownFilmIds]);

  // Handle mark as watched
  const handleMarkWatched = useCallback(async () => {
    if (!selectedMedia) return;

    const result = await markAsWatched(selectedMedia.id);

    if (result.success) {
      setSelectedMedia(null);
      setPersuasivePhrase(null);
      setMovieEmoji('🎬'); // Reset emoji
      setSpinCount(0); // Reset spin count after watching
      setShownFilmIds([]); // Reset shown films
      setSelectedGenre(''); // Reset genre filter
      setSelectedDuration(''); // Reset duration filter
      await loadGenres(); // Reload genres to reflect updated watchlist
      onWatched?.();
    }
  }, [selectedMedia, onWatched, loadGenres]);

  // Get format icon
  const FormatIcon = selectedMedia
    ? formatIcons[selectedMedia.format] || Film
    : Film;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card - Cinema Screen Style */}
      <div className="relative">
        {/* Top Frame */}
        <div className="h-3 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-xl border-t border-l border-r border-zinc-600" />
        
        {/* Screen */}
        <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-l border-r border-zinc-700 p-4 sm:p-6 md:p-8 overflow-hidden">
          {/* Projector Light Effect */}
          <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-gradient-to-b from-yellow-500/5 to-transparent projector-light" />
          
          {/* Subtle Red Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light tracking-wide text-zinc-200">
              {isSpinning ? '🎬 Rolling the reels...' : '🎟️ Ready for showtime?'}
            </h2>
          </div>

          {/* Slot Display */}
          <div className="min-h-[200px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isSpinning ? (
                // Loading State - Film Reel Animation
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
                    className="text-6xl mb-6"
                  >
                    🎥
                  </motion.div>
                  <motion.p
                    key={currentPhrase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-yellow-400/80 font-light italic"
                  >
                    {currentPhrase}
                  </motion.p>
                </motion.div>
              ) : selectedMedia ? (
                // Result State - Feature Presentation
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center w-full"
                >
                  {/* Format Badge */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-zinc-500 text-sm flex items-center gap-2">
                      <span className="inline-block w-8 h-px bg-zinc-700" />
                      Tonight&apos;s Feature
                      <span className="inline-block w-8 h-px bg-zinc-700" />
                    </span>
                  </div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight px-2"
                  >
                    {movieEmoji} {selectedMedia.title} {movieEmoji}
                  </motion.h3>

                  {/* Meta Info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2"
                  >
                    {selectedMedia.year && <span>{selectedMedia.year}</span>}
                    {selectedMedia.duration && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>{selectedMedia.duration}</span>
                      </>
                    )}
                    {selectedMedia.genre && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>{selectedMedia.genre}</span>
                      </>
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

                  {/* Persuasive Phrase */}
                  {persuasivePhrase && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-800/30 rounded-lg p-4 mb-6"
                    >
                      <p className="text-yellow-300/90 italic font-light">
                        "{movieEmoji} {persuasivePhrase}"
                      </p>
                    </motion.div>
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
                </motion.div>
              ) : error ? (
                // Error State
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-zinc-400 mb-4">{error}</p>
                </motion.div>
              ) : (
                // Empty State
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-zinc-400 text-lg font-light">
                    Press the button to start the show
                  </p>
                  <p className="text-zinc-600 text-sm mt-2">🍿 Grab your popcorn!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 mt-8">
            {/* Spin Counter */}
            {spinCount > 0 && spinCount < MAX_SPINS && (
              <div className="text-sm text-yellow-500 flex items-center gap-2">
                <span>🎟️</span>
                {MAX_SPINS - spinCount} ticket{MAX_SPINS - spinCount !== 1 ? 's' : ''} remaining
              </div>
            )}

            {/* Filters Panel - always visible when spins available */}
            {spinCount < MAX_SPINS && (
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Genre Pills */}
                {genres.length > 0 && (
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Genre</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedGenre('')}
                        disabled={isSpinning}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200 ${
                          selectedGenre === ''
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium shadow-lg shadow-yellow-500/20'
                            : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700/50'
                        } disabled:opacity-50`}
                      >
                        🎬 All
                      </button>
                      {genres.slice(0, 8).map((genre) => (
                        <button
                          key={genre}
                          onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
                          disabled={isSpinning}
                          className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200 ${
                            selectedGenre === genre
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium shadow-lg shadow-yellow-500/20'
                              : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700/50'
                          } disabled:opacity-50`}
                        >
                          {GENRE_EMOJIS[genre] || '🎬'} {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration Pills */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Duration</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedDuration(selectedDuration === option.value ? '' : option.value)}
                        disabled={isSpinning}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200 ${
                          selectedDuration === option.value
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium shadow-lg shadow-yellow-500/20'
                            : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700/50'
                        } disabled:opacity-50`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(selectedGenre || selectedDuration) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <span>Filtering by:</span>
                    {selectedGenre && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
                        {selectedGenre}
                      </span>
                    )}
                    {selectedDuration && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
                        {DURATION_OPTIONS.find(d => d.value === selectedDuration)?.label}
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedGenre(''); setSelectedDuration(''); }}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {spinCount >= MAX_SPINS && selectedMedia ? (
              <>
                {/* No more spins - only show Mark as Watched */}
                <div className="text-sm text-yellow-400 mb-2 sm:mb-0 sm:mr-2">🎟️ Final showing!</div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkWatched}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base rounded-full transition-colors shadow-lg shadow-emerald-900/50"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ Mark as Watched</span>
                </motion.button>
              </>
            ) : selectedMedia ? (
              <>
                {/* Spin Again */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm sm:text-base rounded-full transition-colors disabled:opacity-50 border border-zinc-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🎰 Spin Again</span>
                </motion.button>

                {/* Mark as Watched */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkWatched}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base rounded-full transition-colors shadow-lg shadow-emerald-900/50"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ Watched</span>
                </motion.button>
              </>
            ) : (
              /* Main Spin Button - Cinema Red */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                disabled={isSpinning}
                className="group relative px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-full transition-all disabled:opacity-50 overflow-hidden shadow-xl shadow-red-900/50 border border-red-500/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-lg sm:text-xl">🎬</span>
                  <span className="text-sm sm:text-base">Roll the Film!</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            )}
            </div>
          </div>
        </div>
        </div>
        
        {/* Bottom Frame */}
        <div className="h-3 bg-gradient-to-t from-zinc-700 to-zinc-800 rounded-b-xl border-b border-l border-r border-zinc-600" />
      </div>
      
      {/* Speaker Dots */}
      <div className="flex justify-center gap-1 mt-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
        ))}
      </div>
    </div>
  );
}
