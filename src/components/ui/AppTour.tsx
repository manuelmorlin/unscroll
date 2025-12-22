'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Unscroll! 🎬',
    description: 'Your personal cinema companion. Let me show you around!',
    emoji: '🍿',
    position: 'center',
  },
  {
    id: 'slot-machine',
    title: 'Can\'t Decide What to Watch?',
    description: 'Spin the slot machine and let fate choose your next film from your watchlist!',
    emoji: '🎰',
    target: '[data-tour="slot-machine"]',
    position: 'bottom',
  },
  {
    id: 'add-film',
    title: 'Add Films to Your List',
    description: 'Tap here to search and add movies. We\'ll auto-fill all the details for you!',
    emoji: '➕',
    target: '[data-tour="add-button"]',
    position: 'bottom',
  },
  {
    id: 'watchlist',
    title: 'Your Watchlist',
    description: 'Browse all your saved films. Filter by status: To Watch, Watching, or Watched.',
    emoji: '📋',
    target: '[data-tour="nav-list"]',
    position: 'top',
  },
  {
    id: 'diary',
    title: 'Film Diary',
    description: 'Keep track of everything you\'ve watched with ratings and reviews.',
    emoji: '📔',
    target: '[data-tour="nav-diary"]',
    position: 'top',
  },
  {
    id: 'stats',
    title: 'Your Statistics',
    description: 'See your viewing habits, favorite genres, and total watch time.',
    emoji: '📊',
    target: '[data-tour="nav-stats"]',
    position: 'top',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Start building your watchlist and let the movie magic begin!',
    emoji: '✨',
    position: 'center',
  },
];

interface AppTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const TOUR_STORAGE_KEY = 'unscroll-tour-completed';

export function AppTour({ onComplete, forceShow = false }: AppTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should show
  useEffect(() => {
    if (forceShow) {
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
      }, 0);
      return;
    }

    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Update target element position
  useEffect(() => {
    if (!isOpen) return;

    const step = tourSteps[currentStep];
    // Use requestAnimationFrame to batch all state updates
    requestAnimationFrame(() => {
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    });
  }, [currentStep, isOpen]);

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
  const isCentered = step.position === 'center' || !targetRect;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (isCentered || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            onClick={handleSkip}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            {/* Spotlight on target */}
            {targetRect && !isCentered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute rounded-2xl"
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
                  border: '2px solid rgba(251, 191, 36, 0.5)',
                  background: 'transparent',
                }}
              />
            )}
          </motion.div>

          {/* Tooltip/Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[201] w-[320px] max-w-[calc(100vw-32px)]"
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-heavy rounded-2xl overflow-hidden border border-white/10">
              {/* Header */}
              <div className="relative p-4 pb-0">
                <button
                  onClick={handleSkip}
                  className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <motion.div
                  key={step.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center border border-amber-400/20"
                >
                  <span className="text-3xl">{step.emoji}</span>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-4 pt-2 text-center">
                <motion.h3
                  key={`title-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-semibold text-white mb-2"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  key={`desc-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm text-zinc-400 leading-relaxed"
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 pb-3">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-amber-400 w-4'
                        : index < currentStep
                        ? 'bg-amber-400/50'
                        : 'bg-zinc-600'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 p-4 pt-0">
                {!isFirstStep && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrev}
                    className="flex-1 py-2.5 px-4 text-sm font-medium text-zinc-400 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1 ${
                    isLastStep
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black'
                      : 'bg-gradient-to-b from-red-500 to-red-700 text-white'
                  }`}
                >
                  {isLastStep ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Let&apos;s Go!
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to control tour from anywhere
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
