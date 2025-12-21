'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Film, ChevronRight, AlertCircle } from 'lucide-react';
import { actionGetRecommendations } from '@/lib/actions/ai';
import type { MediaItem } from '@/types/database';

interface Recommendation {
  title: string;
  year?: number;
  reason: string;
  matchScore: number;
}

interface RecommendationsProps {
  watchedFilms: MediaItem[];
  allTitles: string[];
}

export function Recommendations({ watchedFilms, allTitles }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filmData = watchedFilms
      .filter(f => f.status === 'watched')
      .map(f => ({
        title: f.title,
        genre: f.genre,
        rating: f.user_rating,
        year: f.year,
      }));

    const result = await actionGetRecommendations(filmData, allTitles);

    if (result.success && result.data) {
      setRecommendations(result.data.recommendations);
      setAnalysis(result.data.analysis);
    } else {
      setError(result.error || 'Failed to get recommendations');
    }

    setIsLoading(false);
  }, [watchedFilms, allTitles]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-medium text-white">AI Recommendations</h3>
        </div>
        {recommendations && (
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!recommendations && !isLoading && !error && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-400 mb-4">
            Get personalized film recommendations based on your taste
          </p>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading || watchedFilms.filter(f => f.user_rating && f.user_rating >= 3).length < 3}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Get Recommendations
          </button>
          {watchedFilms.filter(f => f.user_rating && f.user_rating >= 3).length < 3 && (
            <p className="text-xs text-zinc-500 mt-2">
              Rate at least 3 films to get recommendations
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            </motion.div>
            <p className="text-sm text-zinc-400">Analyzing your taste...</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {recommendations && (
        <div className="space-y-3">
          {analysis && (
            <p className="text-xs text-zinc-400 italic mb-3 px-2">
              &quot;{analysis}&quot;
            </p>
          )}
          
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {rec.title}
                  </p>
                  {rec.year && (
                    <span className="text-xs text-zinc-500">({rec.year})</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate">{rec.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-yellow-500/20 rounded text-xs font-medium text-yellow-400">
                  {rec.matchScore}%
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
