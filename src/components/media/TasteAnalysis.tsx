'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, Lightbulb, Eye, User, AlertCircle, Sparkles } from 'lucide-react';
import { actionAnalyzeTaste } from '@/lib/actions/ai';
import type { MediaItem } from '@/types/database';

interface TasteData {
  dna: string;
  patterns: string[];
  filmSoulmate: { director: string; reason: string };
  blindSpots: string[];
  quirks: string[];
  criticScore: number;
  mainstreamScore: number;
}

interface TasteAnalysisProps {
  films: MediaItem[];
}

export function TasteAnalysis({ films }: TasteAnalysisProps) {
  const [analysis, setAnalysis] = useState<TasteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchedFilms = films.filter(f => f.status === 'watched');

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filmData = watchedFilms.map(f => ({
      title: f.title,
      genre: f.genre,
      rating: f.user_rating,
      year: f.year,
      duration: f.duration,
      director: f.director,
      language: f.original_language,
    }));

    const result = await actionAnalyzeTaste({ films: filmData });

    if (result.success && result.data) {
      setAnalysis(result.data);
    } else {
      setError(result.error || 'Failed to analyze taste');
    }

    setIsLoading(false);
  }, [watchedFilms]);

  const minFilmsRequired = 5;
  const hasEnoughFilms = watchedFilms.length >= minFilmsRequired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-gradient-to-br from-purple-900/20 via-zinc-900 to-zinc-950 border border-purple-800/30 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Taste Analysis</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">AI</span>
        </div>
        {analysis && (
          <button
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!analysis && !isLoading && !error && (
        <div className="text-center py-6">
          <Brain className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-4">
            Discover your unique cinematic DNA
          </p>
          <button
            onClick={fetchAnalysis}
            disabled={isLoading || !hasEnoughFilms}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Analyze My Taste
          </button>
          {!hasEnoughFilms && (
            <p className="text-xs text-zinc-500 mt-2">
              Watch at least {minFilmsRequired} films to unlock analysis
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-10 h-10 text-purple-400 mx-auto mb-2" />
            </motion.div>
            <p className="text-sm text-zinc-400">Analyzing your film DNA...</p>
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

      {analysis && (
        <div className="space-y-4">
          {/* DNA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
          >
            <h4 className="text-xs text-purple-300 font-medium mb-2 flex items-center gap-1">
              🧬 Your Cinematic DNA
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed">{analysis.dna}</p>
          </motion.div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-3 bg-zinc-800/50 rounded-lg text-center"
            >
              <p className="text-2xl font-bold text-yellow-400">{analysis.criticScore}%</p>
              <p className="text-xs text-zinc-400">Critic Score</p>
              <p className="text-[10px] text-zinc-500">
                {analysis.criticScore > 70 ? 'Very critical' : analysis.criticScore > 40 ? 'Balanced' : 'Generous'}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 bg-zinc-800/50 rounded-lg text-center"
            >
              <p className="text-2xl font-bold text-purple-400">{analysis.mainstreamScore}%</p>
              <p className="text-xs text-zinc-400">Mainstream</p>
              <p className="text-[10px] text-zinc-500">
                {analysis.mainstreamScore > 70 ? 'Crowd pleaser' : analysis.mainstreamScore > 40 ? 'Eclectic' : 'Indie soul'}
              </p>
            </motion.div>
          </div>

          {/* Film Soulmate */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 bg-zinc-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-yellow-500" />
              <h4 className="text-xs text-zinc-300 font-medium">Your Spirit Director</h4>
            </div>
            <p className="text-sm font-semibold text-white">{analysis.filmSoulmate.director}</p>
            <p className="text-xs text-zinc-400 mt-1">{analysis.filmSoulmate.reason}</p>
          </motion.div>

          {/* Patterns */}
          {analysis.patterns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h4 className="text-xs text-zinc-300 font-medium">Hidden Patterns</h4>
              </div>
              <div className="space-y-1">
                {analysis.patterns.map((pattern, i) => (
                  <p key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {pattern}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Blind Spots */}
          {analysis.blindSpots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs text-zinc-300 font-medium">Blind Spots</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.blindSpots.map((spot, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300"
                  >
                    {spot}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quirks */}
          {analysis.quirks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs text-zinc-300 font-medium">Your Quirks</h4>
              </div>
              <div className="space-y-1">
                {analysis.quirks.map((quirk, i) => (
                  <p key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-pink-400">✦</span>
                    {quirk}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
