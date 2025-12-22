'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Check, Eye, Trash2, RotateCcw, Pencil, X, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaStatus, deleteMediaItem, updateMediaItem } from '@/lib/actions/media';
import { actionGenerateReview } from '@/lib/actions/ai';
import { StarRating } from '@/components/ui';
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
// EDIT MODAL
// ==============================================

interface EditModalProps {
  media: MediaItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<MediaItem>) => Promise<void>;
}

function EditModal({ media, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(media.title);
  const [year, setYear] = useState(media.year?.toString() || '');
  const [genre, setGenre] = useState(media.genre || '');
  const [duration, setDuration] = useState(media.duration || '');
  const [plot, setPlot] = useState(media.plot || '');
  const [cast, setCast] = useState(
    Array.isArray(media.cast) ? media.cast.join(', ') : media.cast || ''
  );
  const [isSaving, setIsSaving] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-red-900/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-red-900/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>✏️</span> Edit Movie
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">🎬 Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              required
            />
          </div>

          {/* Year & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">📅 Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">⏱️ Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                placeholder="2h 30m"
              />
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">🎭 Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              placeholder="Drama, Thriller"
            />
          </div>

          {/* Cast */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">⭐ Cast</label>
            <input
              type="text"
              value={cast}
              onChange={(e) => setCast(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          {/* Plot */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">📝 Plot</label>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 resize-none transition-all"
              placeholder="Brief plot description..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-red-900/30 border border-red-500/30"
            >
              {isSaving ? 'Saving...' : '✅ Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ==============================================
// RATE MODAL - Opens after marking as Watched
// ==============================================

interface RateModalProps {
  media: MediaItem;
  onClose: () => void;
  onRate: (id: string, rating: number, review?: string) => Promise<void>;
}

function RateModal({ media, onClose, onRate }: RateModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    await onRate(media.id, rating, review || undefined);
    setIsSaving(false);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleSkip}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-green-900/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-green-900/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Success Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full flex items-center justify-center border border-green-500/30">
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          🎬 {media.title}
        </h2>
        <p className="text-sm text-green-400 text-center mb-6">
          Marked as watched!
        </p>

        {/* Rating Section */}
        <div className="mb-6">
          <p className="text-sm text-zinc-400 text-center mb-3 flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
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
              <button
                onClick={handleGenerateReview}
                disabled={isGeneratingReview}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
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
              </button>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think of this film?"
              className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSave}
            disabled={!rating || isSaving}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="w-full py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all text-sm"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================================
// MEDIA CARD
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
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative overflow-hidden"
    >
      {/* Main Card */}
      <div className={`relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-red-900/10 ${status.borderColor} hover:border-red-700/50`}>
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
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
            <div className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-xl sm:text-2xl shadow-inner">
              {genreEmoji}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
              <button
                onClick={() => onViewDetails(media)}
                className="text-base sm:text-lg font-semibold text-white truncate leading-tight text-left hover:text-yellow-400 transition-colors"
              >
                {media.title}
              </button>
              {/* Status Badge */}
              <span className={`flex-shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                {status.label}
              </span>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-400 mb-2 sm:mb-3">
              {media.year && (
                <span className="flex items-center gap-1">
                  <span className="text-zinc-600">📅</span>
                  {media.year}
                </span>
              )}
              {media.duration && (
                <span className="flex items-center gap-1">
                  <span className="text-zinc-600">⏱️</span>
                  {media.duration}
                </span>
              )}
              {media.genre && (
                <span className="text-zinc-500 truncate max-w-[100px] sm:max-w-[150px]">
                  {media.genre}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => onEdit(media)}
                className="p-1.5 sm:p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              {media.status !== 'unwatched' && (
                <button
                  onClick={() => onStatusChange(media.id, 'unwatched')}
                  className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Move to To Watch"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              {media.status !== 'watching' && (
                <button
                  onClick={() => onStatusChange(media.id, 'watching')}
                  className="p-1.5 sm:p-2 text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                  title="Mark as Watching"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              {media.status !== 'watched' && (
                <button
                  onClick={() => onStatusChange(media.id, 'watched')}
                  className="p-1.5 sm:p-2 text-zinc-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                  title="Mark as Watched"
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(media.id)}
                className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
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

  const filteredItems =
    filter === 'all'
      ? mediaItems
      : mediaItems.filter((item) => item.status === filter);

  const handleStatusChange = async (id: string, status: MediaStatus) => {
    await updateMediaStatus(id, status);
    
    // Open rating modal when marking as watched
    if (status === 'watched') {
      const media = mediaItems.find(item => item.id === id);
      if (media) {
        setRatingMedia(media);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMediaItem(id);
  };

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
  };

  const handleViewDetails = (media: MediaItem) => {
    setViewingMedia(media);
  };

  const handleSaveEdit = async (id: string, updates: Partial<MediaItem>) => {
    await updateMediaItem(id, updates);
  };

  const handleRate = async (id: string, rating: number, review?: string) => {
    const updates: Partial<MediaItem> = { user_rating: rating };
    if (review) {
      updates.user_review = review;
    }
    await updateMediaItem(id, updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-zinc-900/50 border border-red-900/20 rounded-xl animate-pulse"
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

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-zinc-400 mb-2">
          {filter === 'all'
            ? "Your cinema is empty"
            : `No ${filter} films`}
        </p>
        <p className="text-zinc-500 text-sm">
          🍿 Add some films to get started
        </p>
      </div>
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

      {/* Stats - scrollable on mobile */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-zinc-500 overflow-x-auto scrollbar-hide pb-1">
        <span className="whitespace-nowrap">🎬 {filteredItems.length}</span>
        <span className="text-zinc-700">•</span>
        <span className="whitespace-nowrap">🎟️ {unwatchedCount}</span>
        <span className="text-zinc-700">•</span>
        <span className="whitespace-nowrap">👀 {watchingCount}</span>
        <span className="text-zinc-700">•</span>
        <span className="whitespace-nowrap">✅ {watchedCount}</span>
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
