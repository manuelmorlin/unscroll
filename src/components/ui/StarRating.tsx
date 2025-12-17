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

const ratingLabels: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing',
};

const ratingEmojis: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '🤩',
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
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`flex items-center ${gapClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            whileHover={!readOnly ? { scale: 1.2 } : {}}
            whileTap={!readOnly ? { scale: 0.9 } : {}}
            className={`relative transition-colors ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            {/* Background star (empty) */}
            <Star 
              className={`${sizeClasses[size]} text-zinc-700 ${
                !readOnly && 'group-hover:text-zinc-600'
              }`}
              strokeWidth={1.5}
            />
            
            {/* Filled star overlay */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: star <= displayValue ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
            >
              <Star 
                className={`${sizeClasses[size]} ${
                  star <= displayValue 
                    ? hoverValue 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-yellow-500 fill-yellow-500'
                    : 'text-zinc-700'
                }`}
                strokeWidth={1.5}
              />
            </motion.div>
            
            {/* Sparkle effect on hover */}
            {!readOnly && hoverValue === star && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full bg-yellow-400/30 rounded-full" />
              </motion.div>
            )}
          </motion.button>
        ))}
        
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

// Compact version for cards
export function StarRatingCompact({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'md' }) {
  if (!value) return null;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= value 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-zinc-700'
            }`}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-zinc-400`}>
        {ratingEmojis[value]}
      </span>
    </div>
  );
}
