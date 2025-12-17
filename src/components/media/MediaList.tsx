'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Check, Eye, Trash2, RotateCcw, Pencil, X } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaStatus, deleteMediaItem, updateMediaItem } from '@/lib/actions/media';
import type { MediaItem, MediaStatus } from '@/types/database';

const formatIcons = {
  movie: Film,
};

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
              className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500"
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
                className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">⏱️ Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500"
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
              className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500"
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
              className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500"
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
              className="w-full px-4 py-2 bg-zinc-900/80 border border-red-900/30 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none"
              placeholder="Brief plot description..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-red-900/30"
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
// MEDIA CARD
// ==============================================

interface MediaCardProps {
  media: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (media: MediaItem) => void;
}

function MediaCard({ media, onStatusChange, onDelete, onEdit }: MediaCardProps) {
  const FormatIcon = formatIcons[media.format] || Film;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/20 rounded-xl p-4 hover:border-red-800/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${statusColors[media.status]}`}
            />
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-white truncate mb-1">
            {media.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {media.year && <span>{media.year}</span>}
            {media.duration && (
              <>
                <span>•</span>
                <span>{media.duration}</span>
              </>
            )}
            {media.genre && (
              <>
                <span>•</span>
                <span className="truncate">{media.genre}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions - always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(media)}
            className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {media.status !== 'unwatched' && (
            <button
              onClick={() => onStatusChange(media.id, 'unwatched')}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Move to To Watch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {media.status !== 'watching' && (
            <button
              onClick={() => onStatusChange(media.id, 'watching')}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Mark as Watching"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {media.status !== 'watched' && (
            <button
              onClick={() => onStatusChange(media.id, 'watched')}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Mark as Watched"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(media.id)}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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

  const filteredItems =
    filter === 'all'
      ? mediaItems
      : mediaItems.filter((item) => item.status === filter);

  const handleStatusChange = async (id: string, status: MediaStatus) => {
    await updateMediaStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    await deleteMediaItem(id);
  };

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
  };

  const handleSaveEdit = async (id: string, updates: Partial<MediaItem>) => {
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

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-zinc-500">
        <span>🎬 {filteredItems.length} films</span>
        <span>•</span>
        <span>🎟️ {unwatchedCount} to watch</span>
        <span>•</span>
        <span>👀 {watchingCount} watching</span>
        <span>•</span>
        <span>✅ {watchedCount} watched</span>
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
          />
        ))}
      </div>
    </div>
  );
}
