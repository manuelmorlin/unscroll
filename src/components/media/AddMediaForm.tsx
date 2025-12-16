'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, X, Loader2, Film } from 'lucide-react';
import { addMediaItem } from '@/lib/actions/media';
import { actionAutofill } from '@/lib/actions/ai';
import type { MediaFormat, MediaItemInsert } from '@/types/database';

const FORMAT_OPTIONS: { value: MediaFormat; label: string; icon: typeof Film }[] = [
  { value: 'movie', label: 'Film', icon: Film },
];

interface AddMediaFormProps {
  onSuccess?: () => void;
}

export function AddMediaForm({ onSuccess }: AddMediaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [plot, setPlot] = useState('');
  const [cast, setCast] = useState('');
  const [duration, setDuration] = useState('');
  const [format, setFormat] = useState<MediaFormat>('movie');
  const [year, setYear] = useState('');

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('');
    setGenre('');
    setPlot('');
    setCast('');
    setDuration('');
    setFormat('movie');
    setYear('');
    setError(null);
  }, []);

  // Handle autofill
  const handleAutofill = useCallback(async () => {
    if (!title.trim()) {
      setError('Enter a title first');
      return;
    }

    setIsAutofilling(true);
    setError(null);

    const result = await actionAutofill(title);

    if (result.success && result.data) {
      setGenre(result.data.genre);
      setPlot(result.data.plot);
      setCast(result.data.cast.join(', '));
      setDuration(result.data.duration);
      setFormat(result.data.format);
      setYear(result.data.year.toString());
    } else {
      setError(result.error || 'Autofill failed');
    }

    setIsAutofilling(false);
  }, [title]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const mediaData: MediaItemInsert = {
        title: title.trim(),
        genre: genre || null,
        plot: plot || null,
        cast: cast ? cast.split(',').map((c) => c.trim()) : null,
        duration: duration || null,
        format,
        year: year ? parseInt(year) : null,
      };

      const result = await addMediaItem(mediaData);

      if (result.success) {
        resetForm();
        setIsOpen(false);
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to add media');
      }

      setIsSubmitting(false);
    },
    [title, genre, plot, cast, duration, format, year, resetForm, onSuccess]
  );

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Media</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[5%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h2 className="text-xl font-semibold text-white">Add to Watchlist</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Title + Autofill */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Title *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Inception"
                      className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAutofill}
                      disabled={isAutofilling || !title.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAutofilling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Autofill</span>
                    </motion.button>
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FORMAT_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormat(value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          format === value
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Genre</label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g., Sci-Fi, Thriller"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2010"
                      min="1800"
                      max="2100"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 2h 28m or 5 Seasons"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Cast */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="e.g., Leonardo DiCaprio, Ellen Page"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Plot */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Plot</label>
                  <textarea
                    value={plot}
                    onChange={(e) => setPlot(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
