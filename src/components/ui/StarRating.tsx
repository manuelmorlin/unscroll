'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Letterboxd-style half-star ratings
const ratingLabels: Record<number, string> = {
  0.5: 'Awful',
  1: 'Terrible',
  1.5: 'Very Bad',
  2: 'Bad',
  2.5: 'Meh',
  3: 'Okay',
  3.5: 'Good',
  4: 'Great',
  4.5: 'Amazing',
  5: 'Masterpiece',
};

const ratingEmojis: Record<number, string> = {
  0.5: '💀',
  1: '😞',
  1.5: '😣',
  2: '😕',
  2.5: '😐',
  3: '🙂',
  3.5: '😊',
  4: '😄',
  4.5: '🤩',
  5: '🏆',
};

export function StarRating({ 
  value, 
  onChange, 
  readOnly = false, 
  size = 'md',
  showLabel = false 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayValue = hoverValue ?? value ?? 0;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const gapClasses = {
    sm: 'gap-0',
    md: 'gap-0',
    lg: 'gap-0.5',
  };

  // Handle click on left or right half of star
  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    const newValue = isLeftHalf ? star - 0.5 : star;
    onChange?.(newValue);
  };

  // Handle hover on left or right half of star
  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const isLeftHalf = mouseX < rect.width / 2;
    setHoverValue(isLeftHalf ? star - 0.5 : star);
  };

  // Get fill percentage for a star based on rating
  const getStarFill = (star: number): 'full' | 'half' | 'empty' => {
    if (displayValue >= star) return 'full';
    if (displayValue >= star - 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`flex items-center ${gapClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getStarFill(star);
          return (
            <motion.button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={(e) => handleClick(star, e)}
              onMouseMove={(e) => handleMouseMove(star, e)}
              onMouseLeave={() => setHoverValue(null)}
              whileHover={!readOnly ? { scale: 1.15 } : {}}
              whileTap={!readOnly ? { scale: 0.95 } : {}}
              className={`relative transition-colors ${
                readOnly ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {/* Background star (empty) */}
              <Star 
                className={`${sizeClasses[size]} text-zinc-700`}
                strokeWidth={1.5}
              />
              
              {/* Half-filled star (left half) */}
              {fill === 'half' && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star 
                    className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`}
                    strokeWidth={1.5}
                  />
                </div>
              )}
              
              {/* Full-filled star */}
              {fill === 'full' && (
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Star 
                    className={`${sizeClasses[size]} ${
                      hoverValue 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-yellow-500 fill-yellow-500'
                    }`}
                    strokeWidth={1.5}
                  />
                </motion.div>
              )}
            </motion.button>
          );
        })}
        
        {/* Rating emoji */}
        <AnimatePresence mode="wait">
          {displayValue > 0 && (
            <motion.span
              key={displayValue}
              initial={{ opacity: 0, scale: 0.5, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 5 }}
              transition={{ duration: 0.2 }}
              className={`ml-2 ${size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl'}`}
            >
              {ratingEmojis[displayValue]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Label */}
      {showLabel && displayValue > 0 && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-zinc-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        >
          {ratingLabels[displayValue]}
        </motion.span>
      )}
    </div>
  );
}

// Compact version for cards - supports half stars
export function StarRatingCompact({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'md' }) {
  if (!value) return null;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  const getStarFill = (star: number): 'full' | 'half' | 'empty' => {
    if (value >= star) return 'full';
    if (value >= star - 0.5) return 'half';
    return 'empty';
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getStarFill(star);
          return (
            <div key={star} className="relative">
              {/* Empty star background */}
              <Star
                className={`${sizeClasses[size]} text-zinc-700`}
                strokeWidth={1.5}
              />
              {/* Half star */}
              {fill === 'half' && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`}
                    strokeWidth={1.5}
                  />
                </div>
              )}
              {/* Full star */}
              {fill === 'full' && (
                <div className="absolute inset-0">
                  <Star
                    className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`}
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-zinc-400`}>
        {ratingEmojis[value]}
      </span>
    </div>
  );
}
