'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Check, X } from 'lucide-react';
import { actionGenerateReview } from '@/lib/actions/ai';

type ReviewStyle = 'casual' | 'critic' | 'poetic' | 'humorous';

interface SmartReviewGeneratorProps {
  title: string;
  rating: number;
  currentReview: string | null;
  onSaveReview: (review: string) => void;
  onClose: () => void;
}

const STYLE_OPTIONS: { id: ReviewStyle; label: string; emoji: string }[] = [
  { id: 'casual', label: 'Casual', emoji: '💬' },
  { id: 'critic', label: 'Critic', emoji: '🎬' },
  { id: 'poetic', label: 'Poetic', emoji: '✨' },
  { id: 'humorous', label: 'Funny', emoji: '😄' },
];

const KEYWORD_SUGGESTIONS = [
  'great acting', 'beautiful cinematography', 'slow pacing', 'unexpected twist',
  'emotional', 'confusing', 'boring', 'masterpiece', 'overrated', 'underrated',
  'rewatchable', 'thought-provoking', 'heartwarming', 'intense', 'predictable',
];

export function SmartReviewGenerator({
  title,
  rating,
  currentReview,
  onSaveReview,
  onClose,
}: SmartReviewGeneratorProps) {
  const [style, setStyle] = useState<ReviewStyle>('casual');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [generatedReview, setGeneratedReview] = useState<string | null>(currentReview);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    const result = await actionGenerateReview(title, rating, keywords, style);

    if (result.success && result.data) {
      setGeneratedReview(result.data.review);
    } else {
      setError(result.error || 'Failed to generate review');
    }

    setIsGenerating(false);
  }, [title, rating, keywords, style]);

  const toggleKeyword = (keyword: string) => {
    setKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword].slice(0, 5)
    );
  };

  const handleSave = () => {
    if (generatedReview) {
      onSaveReview(generatedReview);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-safe sm:mt-0"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-white">AI Review Generator</h3>
          </div>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Style Selection */}
          <div>
            <p className="text-sm text-zinc-400 mb-2">Writing style</p>
            <div className="flex gap-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    style === opt.id
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <p className="text-sm text-zinc-400 mb-2">
              Keywords <span className="text-zinc-500">(optional, max 5)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_SUGGESTIONS.map(kw => (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    keywords.includes(kw)
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {generatedReview ? 'Regenerate' : 'Generate Review'}
              </>
            )}
          </button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Generated Review */}
          <AnimatePresence>
            {generatedReview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="bg-zinc-800/50 rounded-xl p-4 border-l-4 border-yellow-500/50">
                  <p className="text-sm text-zinc-200 italic leading-relaxed">
                    &quot;{generatedReview}&quot;
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Save Review
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
