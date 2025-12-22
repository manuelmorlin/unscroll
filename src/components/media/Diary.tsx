'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Star, Film, ChevronDown, ChevronUp, Minus, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaItem, markAsRewatched, removeRewatch } from '@/lib/actions/media';
import { StarRating, StarRatingCompact, useToast, useConfirm } from '@/components/ui';
import { FilmDetailModal, SmartReviewGenerator } from '@/components/media';
import { formatGenre } from '@/lib/utils';
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
  // Check if it's a year-only date (Jan 1st at midnight UTC)
  if (date.getMonth() === 0 && date.getDate() === 1 && date.getHours() === 0 && date.getMinutes() === 0) {
    // Just show the year
    return date.getFullYear().toString();
  }
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

// Get the most recent watch date (either watched_at or latest rewatch_date)
function getMostRecentWatchDate(media: MediaItem): string | null {
  const dates: Date[] = [];
  
  if (media.watched_at) {
    dates.push(new Date(media.watched_at));
  }
  
  if (media.rewatch_dates && media.rewatch_dates.length > 0) {
    media.rewatch_dates.forEach(d => dates.push(new Date(d)));
  }
  
  if (dates.length === 0) return null;
  
  // Find the most recent date
  const mostRecent = dates.reduce((latest, current) => 
    current > latest ? current : latest
  );
  
  return mostRecent.toISOString();
}

interface DiaryCardProps {
  media: MediaItem;
  onRatingChange: (id: string, rating: number) => void;
  onReviewChange: (id: string, review: string) => void;
  onRewatch: (id: string, date?: string) => void;
  onRemoveRewatch: (id: string, index?: number) => void;
  onViewDetails: (media: MediaItem) => void;
}

function DiaryCard({ media, onRatingChange, onReviewChange, onRewatch, onRemoveRewatch, onViewDetails }: DiaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isRewatching, setIsRewatching] = useState(false);
  const [showRewatchDates, setShowRewatchDates] = useState(false);
  const [newRewatchDate, setNewRewatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [review, setReview] = useState(media.user_review || '');
  const [showReviewGenerator, setShowReviewGenerator] = useState(false);
  const genreEmoji = getGenreEmoji(media.genre);
  const rewatchCount = media.rewatch_count || 0;
  const rewatchDates = media.rewatch_dates || [];
  const totalViews = rewatchCount + 1; // First watch + rewatches

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

  const handleRewatch = async () => {
    setIsRewatching(true);
    const date = new Date(newRewatchDate).toISOString();
    await onRewatch(media.id, date);
    setIsRewatching(false);
    setNewRewatchDate(new Date().toISOString().split('T')[0]);
  };

  const handleRemoveRewatch = async (index?: number) => {
    await onRemoveRewatch(media.id, index);
  };

  const handleSaveGeneratedReview = async (generatedReview: string) => {
    setReview(generatedReview);
    await onReviewChange(media.id, generatedReview);
    setShowReviewGenerator(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-500/20">
        {/* Main Row */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Poster or Emoji Fallback - Clickable */}
            {media.poster_url ? (
              <button
                onClick={() => onViewDetails(media)}
                className="relative flex-shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden border border-white/[0.08] shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <Image
                  src={media.poster_url}
                  alt={media.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ) : (
              <button
                onClick={() => onViewDetails(media)}
                className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xl sm:text-2xl transition-transform hover:scale-105 cursor-pointer"
              >
                {genreEmoji}
              </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onViewDetails(media)}
                    className="text-left"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate hover:text-amber-400 transition-colors">
                      {media.title}
                    </h3>
                  </button>
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-400 mt-1">
                    {media.year && <span>{media.year}</span>}
                    {media.duration && (
                      <>
                        <span className="text-white/20">•</span>
                        <span>{media.duration}</span>
                      </>
                    )}
                    {media.genre && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="truncate max-w-[100px] sm:max-w-[150px]">{formatGenre(media.genre)}</span>
                      </>
                    )}
                    {/* Views badge - Glass style */}
                    <span className="text-white/20">•</span>
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${rewatchCount > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'glass text-zinc-400'}`}>
                      <Film className="w-3 h-3" />
                      {totalViews === 1 ? '1×' : `${totalViews}×`}
                    </span>
                  </div>
                </div>

                {/* Watch Date - display only */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">{formatDate(getMostRecentWatchDate(media))}</span>
                    <span className="sm:hidden">
                      {getMostRecentWatchDate(media) ? new Date(getMostRecentWatchDate(media)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {media.user_rating ? (
                    <StarRatingCompact value={media.user_rating} />
                  ) : (
                    <span className="text-xs text-zinc-600 italic">No rating yet</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Watch count with history dropdown */}
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowRewatchDates(!showRewatchDates)}
                      className="flex items-center gap-1.5 px-2 py-1 glass rounded-lg text-sm text-white transition-colors"
                      title="View watch history"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Film className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium">{totalViews}</span>
                      <span className="text-zinc-500 text-xs">{totalViews === 1 ? 'view' : 'views'}</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </motion.button>
                    
                    {/* Watch history dropdown with add rewatch option - Solid style */}
                    <AnimatePresence>
                      {showRewatchDates && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute right-0 top-full mt-2 z-20 rounded-xl shadow-xl w-[300px] overflow-hidden bg-zinc-900 border border-white/10"
                        >
                          {/* Add new watch section */}
                          <div className="p-3 border-b border-white/[0.06]">
                            <p className="text-xs font-medium text-zinc-300 mb-2">➕ Add another view</p>
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={newRewatchDate}
                                onChange={(e) => setNewRewatchDate(e.target.value)}
                                className="input-ethereal flex-1 text-sm px-2 py-1.5 text-white [color-scheme:dark]"
                              />
                              <motion.button
                                onClick={handleRewatch}
                                disabled={isRewatching}
                                whileTap={{ scale: 0.95 }}
                                className="text-xs bg-gradient-to-b from-emerald-400 to-emerald-600 text-black px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {isRewatching ? '...' : 'Add'}
                              </motion.button>
                            </div>
                          </div>
                          
                          {/* Watch history */}
                          <div className="p-3">
                            <p className="text-xs font-medium text-zinc-300 mb-2">📅 Watch history</p>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-hide">
                              {/* First watch (original) */}
                              <div className="flex items-center text-sm h-8 px-2 bg-white/[0.03] rounded-lg">
                                <span className="flex-1 text-zinc-300 truncate">
                                  {formatDate(media.watched_at)}
                                </span>
                                <span className="text-xs text-zinc-500 w-10 text-right">1st</span>
                                <span className="w-6"></span>
                              </div>
                              {/* Rewatches */}
                              {rewatchDates.map((date, index) => (
                                <div key={index} className="flex items-center text-sm h-8 px-2 bg-white/[0.03] rounded-lg group">
                                  <span className="flex-1 text-zinc-300 truncate">
                                    {formatDate(date)}
                                  </span>
                                  <span className="text-xs text-zinc-500 w-10 text-right">{index + 2}{index === 0 ? 'nd' : index === 1 ? 'rd' : 'th'}</span>
                                  <motion.button
                                    onClick={() => handleRemoveRewatch(index)}
                                    className="w-6 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                    title="Remove this watch"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setShowRewatchDates(false)}
                            className="w-full text-xs text-zinc-500 hover:text-white py-2 border-t border-white/[0.06] transition-colors"
                          >
                            Close
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide' : media.user_review ? 'Edit' : 'Rate & Review'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Review Preview */}
              {!isExpanded && media.user_review && (
                <div className="mt-2 pt-2 border-t border-white/[0.04]">
                  <p className="text-xs text-zinc-500 italic line-clamp-2">
                    &quot;{media.user_review}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Rating Section - Ethereal style */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-white/[0.02]">
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
                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-zinc-400">✍️ Your thoughts</label>
                    {media.user_rating && (
                      <motion.button
                        onClick={() => setShowReviewGenerator(true)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gradient-to-b from-purple-500/80 to-pink-500/80 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Generate
                      </motion.button>
                    )}
                  </div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    onBlur={handleReviewSave}
                    placeholder="Write your review..."
                    rows={3}
                    className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-600">
                      {review.length > 0 ? `${review.length} characters` : 'Auto-saves when you click away'}
                    </span>
                    {isSavingReview && (
                      <span className="text-xs text-amber-400">Saving...</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Smart Review Generator Modal */}
      <AnimatePresence>
        {showReviewGenerator && media.user_rating && (
          <SmartReviewGenerator
            title={media.title}
            rating={media.user_rating}
            currentReview={review}
            onSaveReview={handleSaveGeneratedReview}
            onClose={() => setShowReviewGenerator(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Group items by month (using most recent watch date)
function groupByMonth(items: MediaItem[]): Record<string, MediaItem[]> {
  const groups: Record<string, MediaItem[]> = {};
  
  items.forEach((item) => {
    const mostRecentDate = getMostRecentWatchDate(item);
    const dateKey = mostRecentDate 
      ? formatMonth(mostRecentDate)
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
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Filter only watched items and sort by most recent watch date (newest first)
  const watchedItems = mediaItems
    .filter((item) => item.status === 'watched')
    .sort((a, b) => {
      const dateA = getMostRecentWatchDate(a);
      const dateB = getMostRecentWatchDate(b);
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      return timeB - timeA;
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
    showToast('Rating saved');
  };

  const handleReviewChange = async (id: string, review: string) => {
    await updateMediaItem(id, { user_review: review || null });
    showToast('Review saved');
  };

  const handleRewatch = async (id: string, date?: string) => {
    await markAsRewatched(id, date);
    showToast('Rewatch added');
  };

  const handleRemoveRewatch = async (id: string, index?: number) => {
    const media = mediaItems.find(item => item.id === id);
    const confirmed = await confirm({
      title: 'Remove Rewatch',
      message: `Remove this rewatch from "${media?.title || 'this film'}"?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      danger: true,
    });
    
    if (confirmed) {
      await removeRewatch(id, index);
      showToast('Rewatch removed');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 glass-card rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-zinc-400">{error}</p>
      </div>
    );
  }

  if (watchedItems.length === 0) {
    return (
      <motion.div 
        className="glass-card rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">📔</div>
        <p className="text-white text-lg mb-2">Your diary is empty</p>
        <p className="text-zinc-500 text-sm">
          Watch some movies and they&apos;ll appear here
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Stats Header - Glass style */}
      <div className="glass rounded-2xl flex flex-wrap items-center gap-3 sm:gap-6 mb-6 p-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-white">{totalWatched}</p>
            <p className="text-xs text-zinc-500">Films watched</p>
          </div>
        </div>
        
        <div className="w-px h-10 bg-white/[0.06] hidden sm:block" />
        
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <div>
            <p className="text-2xl font-bold text-white">{ratedItems.length}</p>
            <p className="text-xs text-zinc-500">Rated</p>
          </div>
        </div>
        
        {avgRating && (
          <>
            <div className="w-px h-10 bg-white/[0.06] hidden sm:block" />
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
            {/* Month Header - Glass pill */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{month}</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
              <span className="text-xs text-zinc-500">
                {groupedItems[month].length} film{groupedItems[month].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Month Items */}
            <div className="space-y-3 pl-2 border-l-2 border-white/[0.06] ml-4">
              {groupedItems[month].map((media) => (
                <DiaryCard
                  key={media.id}
                  media={media}
                  onRatingChange={handleRatingChange}
                  onReviewChange={handleReviewChange}
                  onRewatch={handleRewatch}
                  onRemoveRewatch={handleRemoveRewatch}
                  onViewDetails={setSelectedMedia}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Film Detail Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <FilmDetailModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
