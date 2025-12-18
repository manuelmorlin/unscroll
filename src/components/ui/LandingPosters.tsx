'use client';

import { useEffect, useState } from 'react';
import { FloatingPosters } from '@/components/ui';

interface LandingPostersProps {
  initialPosters: string[];
}

export function LandingPosters({ initialPosters }: LandingPostersProps) {
  const [posters, setPosters] = useState<string[]>(initialPosters);

  // Shuffle posters on mount for variety
  useEffect(() => {
    setPosters([...initialPosters].sort(() => Math.random() - 0.5));
  }, [initialPosters]);

  return <FloatingPosters posters={posters} />;
}
