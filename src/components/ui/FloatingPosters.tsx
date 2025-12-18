'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface FloatingPostersProps {
  posters: string[];
  className?: string;
}

// Fixed positions for posters
const POSTER_POSITIONS = [
  { x: 5, y: 10 },
  { x: 85, y: 15 },
  { x: 10, y: 40 },
  { x: 80, y: 45 },
  { x: 8, y: 70 },
  { x: 88, y: 75 },
  { x: 15, y: 85 },
  { x: 75, y: 88 },
];

export function FloatingPosters({ posters, className = '' }: FloatingPostersProps) {
  // Create initial posters from props (no useEffect needed for initialization)
  const initialPosters = useMemo(() => {
    if (posters.length === 0) return [];
    return POSTER_POSITIONS.slice(0, Math.min(8, posters.length)).map((pos, i) => ({
      id: i,
      url: posters[i % posters.length],
      position: pos,
      delay: i * 0.2,
    }));
  }, [posters]);

  const [visiblePosters, setVisiblePosters] = useState(initialPosters);

  // Only use effect for the rotation interval
  useEffect(() => {
    if (posters.length === 0) return;

    // Rotate posters every few seconds
    const interval = setInterval(() => {
      setVisiblePosters(prev => prev.map(poster => ({
        ...poster,
        url: posters[Math.floor(Math.random() * posters.length)],
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [posters]);

  if (posters.length === 0) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      <AnimatePresence>
        {visiblePosters.map((poster) => (
          <motion.div
            key={`${poster.id}-${poster.url}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 1,
              delay: poster.delay,
            }}
            className="absolute"
            style={{
              left: `${poster.position.x}%`,
              top: `${poster.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: poster.position.x < 50 ? [-3, 3, -3] : [3, -3, 3],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: poster.delay,
              }}
            >
              <Image
                src={poster.url}
                alt=""
                width={96}
                height={144}
                className="w-16 sm:w-20 md:w-24 h-auto rounded-lg shadow-2xl shadow-black/50 opacity-20 sm:opacity-25 border border-zinc-800/50"
                style={{
                  filter: 'grayscale(30%)',
                }}
                unoptimized
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
