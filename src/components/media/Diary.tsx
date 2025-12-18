'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Star, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaItem } from '@/lib/actions/media';
import { StarRating, StarRatingCompact } from '@/components/ui';
import type { MediaItem } from '@/types/database';

// Genre to emoji mapping
const genreEmojis: Record<string, string> = {
  horror: '👻',
  thriller: '🔍',
  comedy: '😂',
  romance: '💕',
  action: '💥',
  'sci-fi': '🚀',
  science: '🚀',
  fantasy: '🧙',
  drama: '🎭',
  animation: '🎨',
  adventure: '🌍',
  crime: '🔫',
  mystery: '🕵️',
  family: '👨‍👩‍👧‍👦',
  musical: '🎵',
  war: '⚔️',
  western: '🤠',
  documentary: '📹',
  biography: '📖',
  sport: '⚽',
  history: '🏛️',
};

function getGenreEmoji(genre: string | null | undefined): string {
  if (!genre) return '🎬';
  const genreLower = genre.toLowerCase();
  for (const [key, emoji] of Object.entries(genreEmojis)) {
    if (genreLower.includes(key)) return emoji;
  }
  return '🎬';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

interface DiaryCardProps {
  media: MediaItem;
  onRatingChange: (id: string, rating: number) => void;
  onReviewChange: (id: string, review: string) => void;
}

function DiaryCard({ media, onRatingChange, onReviewChange }: DiaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [review, setReview] = useState(media.user_review || '');
  const genreEmoji = getGenreEmoji(media.genre);

  const handleRatingChange = async (rating: number) => {
    setIsRating(true);
    await onRatingChange(media.id, rating);
    setIsRating(false);
  };

  const handleReviewSave = async () => {
    if (review === media.user_review) return;
    setIsSavingReview(true);
    await onReviewChange(media.id, review);
    setIsSavingReview(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-yellow-600/30 transition-colors">
        {/* Main Row */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Poster or Emoji Fallback */}
            {media.poster_url ? (
              <div className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden border border-zinc-700/50 shadow-lg">
                <img
                  src={media.poster_url}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-xl sm:text-2xl">
                {genreEmoji}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                    {media.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-400 mt-1">
                    {media.year && <span>{media.year}</span>}
                    {media.duration && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>{media.duration}</span>
                      </>
                    )}
                    {media.genre && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="truncate max-w-[100px] sm:max-w-[150px]">{media.genre}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Watch Date */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">{formatDate(media.watched_at)}</span>
                    <span className="sm:hidden">
                      {media.watched_at ? new Date(media.watched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  {media.user_rating ? (
                    <StarRatingCompact value={media.user_rating} />
                  ) : (
                    <span className="text-xs text-zinc-500 italic">No rating yet</span>
                  )}
                </div>
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <span>{isExpanded ? 'Hide' : media.user_review ? 'Edit' : 'Rate & Review'}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Review Preview */}
              {!isExpanded && media.user_review && (
                <div className="mt-2 pt-2 border-t border-zinc-800/30">
                  <p className="text-xs text-zinc-400 italic line-clamp-2">
                    &quot;{media.user_review}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Rating Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">How was it?</p>
                    <StarRating
                      value={media.user_rating}
                      onChange={handleRatingChange}
                      size="lg"
                      showLabel
                    />
                  </div>
                  {isRating && (
                    <span className="text-xs text-zinc-500">Saving...</span>
                  )}
                </div>
                
                {/* Review textarea */}
                <div className="mt-4 pt-3 border-t border-zinc-800/30">
                  <label className="block text-sm text-zinc-400 mb-2">✍️ Your thoughts</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    onBlur={handleReviewSave}
                    placeholder="Write your review..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 resize-none transition-all"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-600">
                      {review.length > 0 ? `${review.length} characters` : 'Auto-saves when you click away'}
                    </span>
                    {isSavingReview && (
                      <span className="text-xs text-yellow-500">Saving...</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Group items by month
function groupByMonth(items: MediaItem[]): Record<string, MediaItem[]> {
  const groups: Record<string, MediaItem[]> = {};
  
  items.forEach((item) => {
    const dateKey = item.watched_at 
      ? formatMonth(item.watched_at)
      : 'Unknown';
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  
  return groups;
}

export function Diary() {
  const { mediaItems, isLoading, error } = useMediaItems();

  // Filter only watched items and sort by watched_at (newest first)
  const watchedItems = mediaItems
    .filter((item) => item.status === 'watched')
    .sort((a, b) => {
      const dateA = a.watched_at ? new Date(a.watched_at).getTime() : 0;
      const dateB = b.watched_at ? new Date(b.watched_at).getTime() : 0;
      return dateB - dateA;
    });

  const groupedItems = groupByMonth(watchedItems);
  const monthKeys = Object.keys(groupedItems);

  // Calculate stats
  const totalWatched = watchedItems.length;
  const ratedItems = watchedItems.filter((item) => item.user_rating);
  const avgRating = ratedItems.length > 0
    ? (ratedItems.reduce((sum, item) => sum + (item.user_rating || 0), 0) / ratedItems.length).toFixed(1)
    : null;

  const handleRatingChange = async (id: string, rating: number) => {
    await updateMediaItem(id, { user_rating: rating });
  };

  const handleReviewChange = async (id: string, review: string) => {
    await updateMediaItem(id, { user_review: review || null });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-zinc-900/50 border border-zinc-800/30 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">{error}</p>
      </div>
    );
  }

  if (watchedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📔</div>
        <p className="text-zinc-400 mb-2">Your diary is empty</p>
        <p className="text-zinc-500 text-sm">
          Watch some movies and they&apos;ll appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Header */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-white">{totalWatched}</p>
            <p className="text-xs text-zinc-500">Films watched</p>
          </div>
        </div>
        
        <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
        
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-white">{ratedItems.length}</p>
            <p className="text-xs text-zinc-500">Rated</p>
          </div>
        </div>
        
        {avgRating && (
          <>
            <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <div>
                <p className="text-2xl font-bold text-white">{avgRating}</p>
                <p className="text-xs text-zinc-500">Avg rating</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {monthKeys.map((month) => (
          <div key={month}>
            {/* Month Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-400">{month}</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/20 to-transparent" />
              <span className="text-xs text-zinc-500">
                {groupedItems[month].length} film{groupedItems[month].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Month Items */}
            <div className="space-y-3 pl-2 border-l-2 border-zinc-800/50 ml-4">
              {groupedItems[month].map((media) => (
                <DiaryCard
                  key={media.id}
                  media={media}
                  onRatingChange={handleRatingChange}
                  onReviewChange={handleReviewChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
