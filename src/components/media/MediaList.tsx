'use client';

import { motion } from 'framer-motion';
import { Film, Check, Eye, Trash2 } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { updateMediaStatus, deleteMediaItem } from '@/lib/actions/media';
import type { MediaItem, MediaStatus } from '@/types/database';

const formatIcons = {
  movie: Film,
};

const statusColors = {
  unwatched: 'bg-red-500',
  watching: 'bg-yellow-500',
  watched: 'bg-green-500',
};

interface MediaCardProps {
  media: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onDelete: (id: string) => void;
}

function MediaCard({ media, onStatusChange, onDelete }: MediaCardProps) {
  const FormatIcon = formatIcons[media.format] || Film;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Format Badge */}
          <div className="flex items-center gap-2 mb-2">
            <FormatIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {media.format}
            </span>
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

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
  const { mediaItems, isLoading, error, unwatchedCount, watchedCount } =
    useMediaItems();

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse"
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
        <Film className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
        <p className="text-zinc-400 mb-2">
          {filter === 'all'
            ? "Your watchlist is empty"
            : `No ${filter} films`}
        </p>
        <p className="text-zinc-500 text-sm">
          Add some films to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-zinc-500">
        <span>{filteredItems.length} items</span>
        <span>•</span>
        <span>{unwatchedCount} to watch</span>
        <span>•</span>
        <span>{watchedCount} watched</span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredItems.map((media) => (
          <MediaCard
            key={media.id}
            media={media}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
