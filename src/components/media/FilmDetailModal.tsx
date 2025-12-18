'use client';

import { motion } from 'framer-motion';
import { X, Calendar, Users, Star, FileText } from 'lucide-react';
import Image from 'next/image';
import { StarRatingCompact } from '@/components/ui';
import type { MediaItem } from '@/types/database';

interface FilmDetailModalProps {
  media: MediaItem;
  onClose: () => void;
}

export function FilmDetailModal({ media, onClose }: FilmDetailModalProps) {
  const cast = Array.isArray(media.cast) 
    ? media.cast 
    : media.cast?.split(',').map(s => s.trim()) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-zinc-900 border border-zinc-800 overflow-hidden max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Backdrop Image (if poster available) */}
        {media.poster_url && (
          <div className="absolute inset-0 h-40 sm:h-48">
            <Image
              src={media.poster_url}
              alt=""
              fill
              className="object-cover opacity-30 blur-sm"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/80 to-zinc-900" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="relative pt-4 sm:pt-6 px-5 pb-6 sm:pb-8">
          <div className="flex gap-4 mb-4">
            {/* Poster */}
            {media.poster_url ? (
              <div className="relative flex-shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-lg overflow-hidden border-2 border-zinc-700 shadow-xl -mt-8 sm:-mt-12 z-10">
                <Image
                  src={media.poster_url}
                  alt={media.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-4xl -mt-8 sm:-mt-12 z-10">
                🎬
              </div>
            )}

            {/* Title & Basic Info */}
            <div className="flex-1 pt-4 sm:pt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 leading-tight">
                {media.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                {media.year && <span>{media.year}</span>}
                {media.duration && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{media.duration}</span>
                  </>
                )}
              </div>
              
              {/* User Rating */}
              {media.user_rating && (
                <div className="mt-2">
                  <StarRatingCompact value={media.user_rating} size="md" />
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Details */}
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
            {/* Genre */}
            {media.genre && (
              <div className="flex flex-wrap gap-2">
                {media.genre.split(/,|\//).map((g, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400"
                  >
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Plot */}
            {media.plot && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-300">Plot</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {media.plot}
                </p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-300">Cast</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cast.slice(0, 6).map((actor, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300"
                    >
                      {actor}
                    </span>
                  ))}
                  {cast.length > 6 && (
                    <span className="px-3 py-1 bg-zinc-800/50 rounded-full text-xs text-zinc-500">
                      +{cast.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* User Review */}
            {media.user_review && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-300">Your Review</h3>
                </div>
                <p className="text-sm text-zinc-400 italic leading-relaxed bg-zinc-800/50 rounded-lg p-3">
                  &quot;{media.user_review}&quot;
                </p>
              </div>
            )}

            {/* Watch Date */}
            {media.watched_at && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Calendar className="w-4 h-4" />
                <span>
                  Watched on{' '}
                  {new Date(media.watched_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
