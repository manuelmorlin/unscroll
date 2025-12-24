'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Check, Eye, Trash2, RotateCcw, Pencil, X, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaStatus, deleteMediaItem, updateMediaItem } from '@/lib/actions/media';
import { actionGenerateReview } from '@/lib/actions/ai';
import { StarRating, useToast, useConfirm, useModal } from '@/components/ui';
import { FilmDetailModal } from './FilmDetailModal';
import type { MediaItem, MediaStatus } from '@/types/database';

const formatIcons = {
  movie: Film,
};

const statusConfig = {
  unwatched: { 
    color: 'bg-red-500', 
    label: 'To Watch',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  watching: { 
    color: 'bg-yellow-500', 
    label: 'Watching',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  watched: { 
    color: 'bg-green-500', 
    label: 'Watched',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
};

// Genre to emoji mapping for visual flair
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

const statusColors = {
  unwatched: 'bg-red-500',
  watching: 'bg-yellow-500',
  watched: 'bg-green-500',
};

// ==============================================
// EDIT MODAL - iOS 26.2 ETHEREAL STYLE
// ==============================================

interface EditModalProps {
  media: MediaItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<MediaItem>) => Promise<void>;
}

function EditModal({ media, onClose, onSave }: EditModalProps) {
  const { openModal, closeModal } = useModal();
  const [title, setTitle] = useState(media.title);
  const [year, setYear] = useState(media.year?.toString() || '');
  const [genre, setGenre] = useState(media.genre || '');
  const [duration, setDuration] = useState(media.duration || '');
  const [plot, setPlot] = useState(media.plot || '');
  const [cast, setCast] = useState(
    Array.isArray(media.cast) ? media.cast.join(', ') : media.cast || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Hide floating dock when modal is open
  useEffect(() => {
    openModal();
    return () => closeModal();
  }, [openModal, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    await onSave(media.id, {
      title,
      year: year ? parseInt(year) : undefined,
      genre,
      duration,
      plot,
      cast,
    });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-heavy rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>✏️</span> Edit Movie
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">🎬 Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
              required
            />
          </div>

          {/* Year & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">📅 Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">⏱️ Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
                placeholder="2h 30m"
              />
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">🎭 Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
              placeholder="Drama, Thriller"
            />
          </div>

          {/* Cast */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">⭐ Cast</label>
            <input
              type="text"
              value={cast}
              onChange={(e) => setCast(e.target.value)}
              className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600"
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          {/* Plot */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">📝 Plot</label>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              rows={3}
              className="input-ethereal w-full px-4 py-3 text-white placeholder:text-zinc-600 resize-none"
              placeholder="Brief plot description..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="btn-glass px-5 py-2.5 text-zinc-400 rounded-xl"
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSaving}
              className="btn-primary px-6 py-2.5 text-white font-semibold rounded-xl disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? 'Saving...' : '✅ Save Changes'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ==============================================
// RATE MODAL - iOS 26.2 ETHEREAL STYLE
// ==============================================

type DateMode = 'full' | 'year' | 'none';

interface RateModalProps {
  media: MediaItem;
  onClose: () => void;
  onRate: (id: string, rating: number, review?: string, watchedAt?: string | null) => Promise<void>;
}

function RateModal({ media, onClose, onRate }: RateModalProps) {
  const { openModal, closeModal } = useModal();
  const { confirm } = useConfirm();
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Date selection state
  const [dateMode, setDateMode] = useState<DateMode>('full');
  const [watchedDate, setWatchedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [watchedYear, setWatchedYear] = useState<string>(new Date().getFullYear().toString());

  // Hide floating dock when modal is open
  useEffect(() => {
    openModal();
    return () => closeModal();
  }, [openModal, closeModal]);

  const handleClose = async () => {
    // Check if user has made any changes (rating or review)
    if (rating || review) {
      const confirmed = await confirm({
        title: 'Close without saving?',
        message: 'You have unsaved changes. Are you sure you want to close?',
        confirmText: 'Close',
        cancelText: 'Cancel',
        danger: true
      });
      if (!confirmed) return;
    }
    onClose();
  };

  const handleGenerateReview = useCallback(async () => {
    if (!rating) return;
    
    setIsGeneratingReview(true);
    const result = await actionGenerateReview(media.title, rating, [], 'casual');
    
    if (result.success && result.data) {
      setReview(result.data.review);
    }
    setIsGeneratingReview(false);
  }, [media.title, rating]);

  const handleSave = async () => {
    if (!rating) return;
    
    setIsSaving(true);
    
    // Determine the watched_at value based on date mode
    let watchedAt: string | null = null;
    if (dateMode === 'full') {
      watchedAt = new Date(watchedDate).toISOString();
    } else if (dateMode === 'year') {
      // Store as ISO string for Jan 1 of that year (we'll display just the year)
      watchedAt = `${watchedYear}-01-01T00:00:00.000Z`;
    }
    // If dateMode === 'none', watchedAt remains null
    
    await onRate(media.id, rating, review || undefined, watchedAt);
    setIsSaving(false);
    onClose();
  };

  const handleSkip = () => {
    // Even when skipping rating, save the watched date
    let watchedAt: string | null = null;
    if (dateMode === 'full') {
      watchedAt = new Date(watchedDate).toISOString();
    } else if (dateMode === 'year') {
      watchedAt = `${watchedYear}-01-01T00:00:00.000Z`;
    }
    onRate(media.id, 0, undefined, watchedAt); // rating 0 means skip rating but still set date
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-heavy rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide relative"
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          whileTap={{ scale: 0.9 }}
          title="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Success Badge */}
        <div className="flex justify-center mb-4">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full flex items-center justify-center border border-emerald-500/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            <Check className="w-8 h-8 text-emerald-400" />
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          🎬 {media.title}
        </h2>
        <p className="text-sm text-emerald-400 text-center mb-6">
          Mark as watched
        </p>

        {/* Watch Date Section */}
        <div className="mb-6">
          <p className="text-sm text-zinc-400 text-center mb-3 flex items-center justify-center gap-2">
            📅 When did you watch it?
          </p>
          
          {/* Date Mode Toggle - Pill style */}
          <div className="flex justify-center gap-2 mb-3">
            {(['full', 'year', 'none'] as DateMode[]).map((mode) => (
              <motion.button
                key={mode}
                type="button"
                onClick={() => setDateMode(mode)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  dateMode === mode
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'full' ? 'Full Date' : mode === 'year' ? 'Year Only' : 'No Date'}
              </motion.button>
            ))}
          </div>

          {/* Date Input based on mode */}
          {dateMode === 'full' && (
            <input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="input-ethereal w-full px-4 py-2.5 text-white text-sm [color-scheme:dark]"
            />
          )}
          {dateMode === 'year' && (
            <input
              type="number"
              value={watchedYear}
              onChange={(e) => setWatchedYear(e.target.value)}
              min="1900"
              max={new Date().getFullYear()}
              placeholder="e.g., 2024"
              className="input-ethereal w-full px-4 py-2.5 text-white text-sm text-center"
            />
          )}
          {dateMode === 'none' && (
            <p className="text-xs text-zinc-600 text-center py-2">
              No date will be saved
            </p>
          )}
        </div>

        {/* Rating Section */}
        <div className="mb-6">
          <p className="text-sm text-zinc-400 text-center mb-3 flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Rate this film
          </p>
          <div className="flex justify-center">
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
              showLabel
            />
          </div>
        </div>

        {/* Review Section - Only shows after rating */}
        {rating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">Write a review (optional)</p>
              <motion.button
                onClick={handleGenerateReview}
                disabled={isGeneratingReview}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50 border border-amber-500/20"
                whileTap={{ scale: 0.95 }}
              >
                {isGeneratingReview ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </>
                )}
              </motion.button>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think of this film?"
              className="input-ethereal w-full h-24 px-4 py-3 text-white text-sm placeholder:text-zinc-600 resize-none"
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <motion.button
            onClick={handleSave}
            disabled={!rating || isSaving}
            className="w-full py-3.5 bg-gradient-to-b from-amber-400 to-amber-600 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save {review ? 'Rating & Review' : 'Rating'}
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={handleSkip}
            disabled={isSaving}
            className="w-full py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
            whileTap={{ scale: 0.98 }}
          >
            Skip for now
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================================
// MEDIA CARD - iOS 26.2 ETHEREAL STYLE
// ==============================================

interface MediaCardProps {
  media: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (media: MediaItem) => void;
  onViewDetails: (media: MediaItem) => void;
}

function MediaCard({ media, onStatusChange, onDelete, onEdit, onViewDetails }: MediaCardProps) {
  const status = statusConfig[media.status];
  const genreEmoji = getGenreEmoji(media.genre);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group relative"
    >
      {/* Main Card - Glass morphism */}
      <div className="glass-card relative overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-white/[0.1]">
        {/* Ambient glow based on poster (subtle) */}
        {media.poster_url && (
          <div 
            className="absolute inset-0 opacity-20 blur-3xl -z-10"
            style={{
              backgroundImage: `url(${media.poster_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Poster or Emoji Fallback - Enhanced */}
          {media.poster_url ? (
            <button
              onClick={() => onViewDetails(media)}
              className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
            >
              <img
                src={media.poster_url}
                alt={media.title}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              onClick={() => onViewDetails(media)}
              className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-2xl sm:text-3xl transition-transform hover:scale-105"
            >
              {genreEmoji}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 py-0.5">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <button
                onClick={() => onViewDetails(media)}
                className="text-base sm:text-lg font-semibold text-white truncate leading-tight text-left hover:text-amber-400 transition-colors"
              >
                {media.title}
              </button>
              {/* Status Badge - Glass style */}
              <span className={`
                flex-shrink-0 px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full
                backdrop-blur-sm transition-all
                ${media.status === 'unwatched' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                ${media.status === 'watching' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                ${media.status === 'watched' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
              `}>
                {status.label}
              </span>
            </div>

            {/* Meta Info - Minimal */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-500 mb-3">
              {media.year && (
                <span>{media.year}</span>
              )}
              {media.duration && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span>{media.duration}</span>
                </>
              )}
              {media.genre && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span className="truncate max-w-[120px]">{media.genre}</span>
                </>
              )}
            </div>

            {/* Action Buttons - Ethereal */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => onEdit(media)}
                className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Edit"
                whileTap={{ scale: 0.9 }}
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
              {media.status !== 'unwatched' && (
                <motion.button
                  onClick={() => onStatusChange(media.id, 'unwatched')}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Move to To Watch"
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              )}
              {media.status !== 'watching' && (
                <motion.button
                  onClick={() => onStatusChange(media.id, 'watching')}
                  className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                  title="Mark as Watching"
                  whileTap={{ scale: 0.9 }}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              )}
              {media.status !== 'watched' && (
                <motion.button
                  onClick={() => onStatusChange(media.id, 'watched')}
                  className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Mark as Watched"
                  whileTap={{ scale: 0.9 }}
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button
                onClick={() => onDelete(media.id)}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                title="Delete"
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MediaListProps {
  filter?: MediaStatus | 'all';
}

export function MediaList({ filter = 'all' }: MediaListProps) {
  const { mediaItems, isLoading, error, unwatchedCount, watchingCount, watchedCount } =
    useMediaItems();
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [ratingMedia, setRatingMedia] = useState<MediaItem | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const filteredItems =
    filter === 'all'
      ? mediaItems
      : mediaItems.filter((item) => item.status === filter);

  const handleStatusChange = async (id: string, status: MediaStatus) => {
    // For marking as watched, open the rate modal first (which handles date selection)
    // Don't update status immediately - the modal will handle it
    if (status === 'watched') {
      const media = mediaItems.find(item => item.id === id);
      if (media) {
        setRatingMedia(media);
      }
      return;
    }
    
    // For other status changes, update immediately
    await updateMediaStatus(id, status);
    const statusLabels = { unwatched: 'To Watch', watching: 'Watching', watched: 'Watched' };
    showToast(`Moved to ${statusLabels[status]}`);
  };

  const handleDelete = async (id: string) => {
    const media = mediaItems.find(item => item.id === id);
    const confirmed = await confirm({
      title: 'Delete Film',
      message: `Are you sure you want to remove "${media?.title || 'this film'}" from your watchlist?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });
    
    if (confirmed) {
      await deleteMediaItem(id);
      showToast('Film removed from watchlist');
    }
  };

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
  };

  const handleViewDetails = (media: MediaItem) => {
    setViewingMedia(media);
  };

  const handleSaveEdit = async (id: string, updates: Partial<MediaItem>) => {
    await updateMediaItem(id, updates);
    showToast('Changes saved successfully');
  };

  const handleRate = async (id: string, rating: number, review?: string, watchedAt?: string | null) => {
    // First update status to watched with the selected date
    await updateMediaStatus(id, 'watched', watchedAt);
    
    // If rating was provided (not skipped), save it
    if (rating > 0) {
      const updates: Partial<MediaItem> = { user_rating: rating };
      if (review) {
        updates.user_review = review;
      }
      await updateMediaItem(id, updates);
      showToast('Film marked as watched with rating');
    } else {
      showToast('Film marked as watched');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
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

  if (filteredItems.length === 0) {
    return (
      <motion.div 
        className="glass-card rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-white text-lg mb-2">
          {filter === 'all'
            ? "Your cinema is empty"
            : `No ${filter} films`}
        </p>
        <p className="text-zinc-500 text-sm">
          🍿 Add some films to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingMedia && (
          <EditModal
            media={editingMedia}
            onClose={() => setEditingMedia(null)}
            onSave={handleSaveEdit}
          />
        )}
      </AnimatePresence>

      {/* Rate Modal - Shows after marking as Watched */}
      <AnimatePresence>
        {ratingMedia && (
          <RateModal
            media={ratingMedia}
            onClose={() => setRatingMedia(null)}
            onRate={handleRate}
          />
        )}
      </AnimatePresence>

      {/* Film Detail Modal */}
      <AnimatePresence>
        {viewingMedia && (
          <FilmDetailModal
            media={viewingMedia}
            onClose={() => setViewingMedia(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats - Glass pill style */}
      <div className="glass rounded-xl px-4 py-2.5 mb-4 flex items-center gap-3 sm:gap-4 text-xs sm:text-sm overflow-x-auto scrollbar-hide">
        <span className="whitespace-nowrap text-white/80">🎬 {filteredItems.length}</span>
        <span className="text-white/20">•</span>
        <span className="whitespace-nowrap text-red-400/80">📋 {unwatchedCount}</span>
        <span className="text-white/20">•</span>
        <span className="whitespace-nowrap text-blue-400/80">👀 {watchingCount}</span>
        <span className="text-white/20">•</span>
        <span className="whitespace-nowrap text-emerald-400/80">✅ {watchedCount}</span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredItems.map((media) => (
          <MediaCard
            key={media.id}
            media={media}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
