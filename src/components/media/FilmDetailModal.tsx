'use client';

import { motion } from 'framer-motion';
import { X, Calendar, Clock, Users, Star, FileText, Eye, RefreshCw, Clapperboard, Globe, Tv } from 'lucide-react';
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
  
  const rewatchCount = media.rewatch_count || 0;
  const totalViews = rewatchCount + 1;

  // Parse duration to show in a nicer format
  const formatDuration = (duration: string | null) => {
    if (!duration) return null;
    // If already has "min" or "h", return as is
    if (duration.includes('min') || duration.includes('h')) return duration;
    // Try to parse as number of minutes
    const mins = parseInt(duration);
    if (!isNaN(mins)) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (hours > 0) {
        return `${hours}h ${remainingMins}m`;
      }
      return `${mins}m`;
    }
    return duration;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl bg-zinc-900 border border-zinc-800 overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 scrollbar-yellow">
          {/* Hero Section with Poster */}
          <div className="relative">
            {/* Backdrop blur from poster */}
            {media.poster_url && (
              <div className="absolute inset-0 h-full overflow-hidden">
                <Image
                  src={media.poster_url}
                  alt=""
                  fill
                  className="object-cover opacity-20 blur-xl scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-zinc-900/80 to-zinc-900" />
              </div>
            )}
            
            {/* Content */}
            <div className="relative p-5 sm:p-6">
              <div className="flex gap-5">
                {/* Full Poster */}
                {media.poster_url ? (
                  <div className="relative flex-shrink-0 w-32 sm:w-40 aspect-[2/3] rounded-xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl">
                    <Image
                      src={media.poster_url}
                      alt={media.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-32 sm:w-40 aspect-[2/3] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700/50 flex items-center justify-center text-5xl">
                    🎬
                  </div>
                )}

                {/* Title & Info */}
                <div className="flex-1 min-w-0 py-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                    {media.title}
                  </h2>
                  
                  {/* Year & Duration & Language */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-3">
                    {media.year && (
                      <span className="font-medium">{media.year}</span>
                    )}
                    {media.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(media.duration)}
                      </span>
                    )}
                    {media.original_language && (
                      <span className="flex items-center gap-1 uppercase">
                        <Globe className="w-3.5 h-3.5" />
                        {media.original_language}
                      </span>
                    )}
                  </div>

                  {/* Director */}
                  {media.director && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                      <Clapperboard className="w-3.5 h-3.5" />
                      <span>Directed by <span className="text-zinc-200 font-medium">{media.director}</span></span>
                    </div>
                  )}
                  
                  {/* Genres */}
                  {media.genre && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {media.genre.split(/,|\//).slice(0, 3).map((g, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-xs font-medium text-yellow-400"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* User Rating - Large */}
                  {media.user_rating && (
                    <div className="mt-auto">
                      <p className="text-xs text-zinc-500 mb-1">Your rating</p>
                      <StarRatingCompact value={media.user_rating} size="md" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-5 sm:px-6 pb-6 space-y-5">
            {/* Stats Bar */}
            <div className="flex items-center gap-4 py-3 px-4 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-sm text-zinc-300">
                  {totalViews} {totalViews === 1 ? 'view' : 'views'}
                </span>
              </div>
              {rewatchCount > 0 && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-zinc-300">
                    {rewatchCount} {rewatchCount === 1 ? 'rewatch' : 'rewatches'}
                  </span>
                </div>
              )}
              {media.watched_at && (
                <div className="flex items-center gap-2 ml-auto">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">
                    {new Date(media.watched_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Plot */}
            {media.plot && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Plot
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {media.plot}
                </p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  Cast
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cast.map((actor, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Providers */}
            {media.watch_providers && media.watch_providers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-zinc-500" />
                  Where to Watch
                </h3>
                <div className="flex flex-wrap gap-3">
                  {media.watch_providers.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg"
                      title={provider.provider_name}
                    >
                      {provider.logo_path && (
                        <Image
                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                          alt={provider.provider_name}
                          width={24}
                          height={24}
                          className="rounded"
                          unoptimized
                        />
                      )}
                      <span className="text-sm text-zinc-300">{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">Streaming availability for Italy</p>
              </div>
            )}

            {/* User Review */}
            {media.user_review && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Your Review
                </h3>
                <div className="bg-zinc-800/50 rounded-xl p-4 border-l-4 border-yellow-500/50">
                  <p className="text-sm text-zinc-300 italic leading-relaxed">
                    &quot;{media.user_review}&quot;
                  </p>
                </div>
              </div>
            )}

            {/* No rating prompt */}
            {!media.user_rating && !media.user_review && (
              <div className="text-center py-4 text-zinc-500 text-sm">
                You haven&apos;t rated or reviewed this film yet
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
