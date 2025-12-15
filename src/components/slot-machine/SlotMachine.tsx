'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Check, Film, Tv, Video, Clapperboard } from 'lucide-react';
import { getRandomUnwatched, markAsWatched } from '@/lib/actions/media';
import { actionPersuade } from '@/lib/actions/ai';
import type { MediaItem } from '@/types/database';

// ==============================================
// LOADING PHRASES
// ==============================================

const LOADING_PHRASES = [
  "Consulting the cinema gods...",
  "Shuffling your watchlist...",
  "Analyzing your mood...",
  "Finding the perfect match...",
  "Destiny is loading...",
  "Asking the algorithm...",
  "Rolling the dice...",
  "Summoning entertainment...",
  "Calculating vibes...",
  "The oracle speaks...",
];

// ==============================================
// FORMAT ICONS
// ==============================================

const formatIcons = {
  movie: Film,
  series: Tv,
  documentary: Video,
  anime: Clapperboard,
};

// ==============================================
// COMPONENT
// ==============================================

interface SlotMachineProps {
  onWatched?: () => void;
}

export function SlotMachine({ onWatched }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [persuasivePhrase, setPersuasivePhrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setIsSpinning(true);
    setError(null);
    setSelectedMedia(null);
    setPersuasivePhrase(null);

    // Start phrase animation
    const phraseAnimation = animatePhrases();

    // Fetch random media
    const result = await getRandomUnwatched();

    // Wait for animation to complete
    await phraseAnimation;

    if (!result.success || !result.data) {
      setError(result.error || 'No media found');
      setIsSpinning(false);
      return;
    }

    const media = result.data as MediaItem;
    setSelectedMedia(media);

    // Generate persuasive phrase
    const persuadeResult = await actionPersuade(
      media.title,
      media.genre || '',
      media.plot || ''
    );

    if (persuadeResult.success && persuadeResult.data) {
      setPersuasivePhrase(persuadeResult.data.phrase);
    }

    setIsSpinning(false);
  }, [animatePhrases]);

  // Handle mark as watched
  const handleMarkWatched = useCallback(async () => {
    if (!selectedMedia) return;

    const result = await markAsWatched(selectedMedia.id);

    if (result.success) {
      setSelectedMedia(null);
      setPersuasivePhrase(null);
      onWatched?.();
    }
  }, [selectedMedia, onWatched]);

  // Get format icon
  const FormatIcon = selectedMedia
    ? formatIcons[selectedMedia.format] || Film
    : Film;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 opacity-50" />

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light tracking-wide text-zinc-200">
              {isSpinning ? 'Finding your next watch...' : 'Ready to decide?'}
            </h2>
          </div>

          {/* Slot Display */}
          <div className="min-h-[200px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isSpinning ? (
                // Loading State
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-6"
                  >
                    <Sparkles className="w-full h-full text-amber-400" />
                  </motion.div>
                  <motion.p
                    key={currentPhrase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-zinc-400 font-light italic"
                  >
                    {currentPhrase}
                  </motion.p>
                </motion.div>
              ) : selectedMedia ? (
                // Result State
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center w-full"
                >
                  {/* Format Badge */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <FormatIcon className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                      {selectedMedia.format}
                    </span>
                  </div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
                  >
                    {selectedMedia.title}
                  </motion.h3>

                  {/* Meta Info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-3 text-zinc-400 text-sm mb-6"
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
                      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 mb-6"
                    >
                      <p className="text-amber-200/90 italic font-light">
                        "{persuasivePhrase}"
                      </p>
                    </motion.div>
                  )}

                  {/* Cast */}
                  {selectedMedia.cast && selectedMedia.cast.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-zinc-500"
                    >
                      <span className="text-zinc-600">Starring: </span>
                      {selectedMedia.cast.join(', ')}
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
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500 text-lg font-light">
                    Press the button to discover your next watch
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {selectedMedia ? (
              <>
                {/* Spin Again */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Spin Again</span>
                </motion.button>

                {/* Mark as Watched */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkWatched}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Watched</span>
                </motion.button>
              </>
            ) : (
              /* Main Spin Button */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                disabled={isSpinning}
                className="group relative px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-full transition-all disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Decide for Me</span>
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
  );
}
