'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

// ==============================================
// TOUR STEPS - Simple fullscreen slides
// ==============================================

interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Unscroll!',
    description: 'Your personal cinema companion.\nLet me show you around!',
    emoji: '🍿',
  },
  {
    id: 'slot-machine',
    title: 'Can\'t Decide?',
    description: 'Use the 🎰 tab to spin and let fate choose your next film!',
    emoji: '🎰',
  },
  {
    id: 'add-film',
    title: 'Add Films',
    description: 'Tap the red "Add" button to search and add movies to your list.',
    emoji: '🎬',
  },
  {
    id: 'watchlist',
    title: 'Your Watchlist',
    description: 'Browse all your saved films in the 📋 tab.',
    emoji: '📋',
  },
  {
    id: 'diary',
    title: 'Film Diary',
    description: 'Track what you\'ve watched with ratings in the 📔 tab.',
    emoji: '📔',
  },
  {
    id: 'stats',
    title: 'Statistics',
    description: 'See your viewing habits in the 📊 tab.',
    emoji: '📊',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Start building your watchlist and enjoy!',
    emoji: '✨',
  },
];

// ==============================================
// COMPONENT - Fullscreen carousel style
// ==============================================

interface AppTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const TOUR_STORAGE_KEY = 'unscroll-tour-completed';

export function AppTour({ onComplete, forceShow = false }: AppTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if tour should show
  useEffect(() => {
    if (forceShow) {
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
      }, 0);
      return;
    }

    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #0a0a0a 100%)' }}
        >
          {/* Skip button - top right */}
          <div className="absolute top-4 right-4 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <button
              onClick={handleSkip}
              className="p-3 text-zinc-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main content - vertically centered */}
          <div className="flex-1 flex items-center justify-center px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="text-center w-full max-w-sm"
              >
                {/* Big Emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.1, damping: 12 }}
                  className="text-8xl mb-8"
                >
                  {step.emoji}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-bold text-white mb-4"
                >
                  {step.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-zinc-400 leading-relaxed whitespace-pre-line"
                >
                  {step.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom navigation - fixed at bottom */}
          <div className="px-6 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-amber-400'
                      : index < currentStep
                      ? 'w-2 bg-amber-400/50'
                      : 'w-2 bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev}
                  className="flex-1 py-4 px-6 text-base font-medium text-zinc-300 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </motion.button>
              )}
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className={`flex-1 py-4 px-6 text-base font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 ${
                  isLastStep
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                }`}
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==============================================
// HOOK - Control tour from anywhere
// ==============================================

export function useTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, startTour, resetTour, setShowTour };
}
