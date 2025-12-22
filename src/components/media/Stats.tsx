'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Film, Star, Clock, Calendar, TrendingUp, Award, Clapperboard } from 'lucide-react';
import { useMediaItems } from '@/hooks/useMediaItems';
import { Recommendations } from './Recommendations';
import { TasteAnalysis } from './TasteAnalysis';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  delay?: number;
}

function StatCard({ icon, label, value, sublabel, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-zinc-400">{label}</p>
          {sublabel && <p className="text-[10px] text-zinc-500">{sublabel}</p>}
        </div>
      </div>
    </motion.div>
  );
}

interface GenreBarProps {
  genre: string;
  count: number;
  maxCount: number;
  index: number;
}

function GenreBar({ genre, count, maxCount, index }: GenreBarProps) {
  const percentage = (count / maxCount) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center gap-3"
    >
      <span className="text-sm text-zinc-400 w-24 truncate">{genre}</span>
      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.2 + 0.1 * index, duration: 0.5 }}
          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
        />
      </div>
      <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
    </motion.div>
  );
}

interface RatingDistributionProps {
  ratings: Record<number, number>;
  maxCount: number;
}

function RatingDistribution({ ratings, maxCount }: RatingDistributionProps) {
  // All possible ratings from 0.5 to 5
  const allRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  
  return (
    <div className="flex items-end gap-1 h-24">
      {allRatings.map((rating, i) => {
        const count = ratings[rating] || 0;
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        return (
          <motion.div
            key={rating}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 4)}%` }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            className="flex-1 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"
            title={`${rating}★: ${count} film`}
          />
        );
      })}
    </div>
  );
}

export function Stats() {
  const { mediaItems, isLoading } = useMediaItems();
  
  const stats = useMemo(() => {
    const watched = mediaItems.filter(m => m.status === 'watched');
    const unwatched = mediaItems.filter(m => m.status === 'unwatched');
    
    // Total runtime
    let totalMinutes = 0;
    watched.forEach(m => {
      if (m.duration) {
        // Parse duration like "2h 30m" or "120 min"
        const hourMatch = m.duration.match(/(\d+)\s*h/i);
        const minMatch = m.duration.match(/(\d+)\s*m/i);
        if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
        if (minMatch) totalMinutes += parseInt(minMatch[1]);
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);
    
    // Average rating
    const ratedMovies = watched.filter(m => m.user_rating !== null);
    const avgRating = ratedMovies.length > 0
      ? ratedMovies.reduce((sum, m) => sum + (m.user_rating || 0), 0) / ratedMovies.length
      : 0;
    
    // Genre distribution
    const genreCounts: Record<string, number> = {};
    watched.forEach(m => {
      if (m.genre) {
        // Split genres if comma-separated
        const genres = m.genre.split(/,|\//).map(g => g.trim());
        genres.forEach(g => {
          if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Rating distribution
    const ratingCounts: Record<number, number> = {};
    ratedMovies.forEach(m => {
      const rating = m.user_rating!;
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });
    const maxRatingCount = Math.max(...Object.values(ratingCounts), 1);
    
    // Movies by year (watched)
    const thisYear = new Date().getFullYear();
    const watchedThisYear = watched.filter(m => {
      if (!m.watched_at) return false;
      return new Date(m.watched_at).getFullYear() === thisYear;
    }).length;
    
    // Best rated (5 stars)
    const favorites = watched.filter(m => m.user_rating === 5);
    
    // Recent watches
    const recentWatches = [...watched]
      .sort((a, b) => {
        if (!a.watched_at) return 1;
        if (!b.watched_at) return -1;
        return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
      })
      .slice(0, 4);
    
    return {
      totalWatched: watched.length,
      totalWatchlist: unwatched.length,
      hours,
      days,
      avgRating,
      topGenres,
      ratingCounts,
      maxRatingCount,
      watchedThisYear,
      favorites,
      recentWatches,
      ratedCount: ratedMovies.length,
    };
  }, [mediaItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-zinc-300 mb-2">No stats yet</h3>
        <p className="text-sm text-zinc-500">
          Start adding and watching films to see your statistics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-1">Your Film Stats</h2>
        <p className="text-sm text-zinc-500">Numbers and insights about your watching habits</p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Film className="w-5 h-5" />}
          label="Films Watched"
          value={stats.totalWatched}
          sublabel={`${stats.totalWatchlist} in watchlist`}
          delay={0}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Hours Watched"
          value={stats.hours}
          sublabel={stats.days > 0 ? `That's ${stats.days} days!` : undefined}
          delay={0.1}
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Average Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          sublabel={`${stats.ratedCount} rated`}
          delay={0.2}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Watched This Year"
          value={stats.watchedThisYear}
          sublabel={new Date().getFullYear().toString()}
          delay={0.3}
        />
      </div>

      {/* Rating Distribution */}
      {stats.ratedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-white">Rating Distribution</h3>
          </div>
          <RatingDistribution ratings={stats.ratingCounts} maxCount={stats.maxRatingCount} />
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            <span>½</span>
            <span>★</span>
            <span>1½</span>
            <span>★★</span>
            <span>2½</span>
            <span>★★★</span>
            <span>3½</span>
            <span>★★★★</span>
            <span>4½</span>
            <span>★★★★★</span>
          </div>
        </motion.div>
      )}

      {/* Top Genres */}
      {stats.topGenres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clapperboard className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-white">Top Genres</h3>
          </div>
          <div className="space-y-3">
            {stats.topGenres.map(([genre, count], i) => (
              <GenreBar
                key={genre}
                genre={genre}
                count={count}
                maxCount={stats.topGenres[0][1]}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Favorites */}
      {stats.favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-white">
              Your Favorites ({stats.favorites.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.favorites.slice(0, 8).map((movie) => (
              <div
                key={movie.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
              >
                <span className="text-yellow-500">🏆</span>
                <span className="text-sm text-white truncate max-w-[120px]">
                  {movie.title}
                </span>
              </div>
            ))}
            {stats.favorites.length > 8 && (
              <div className="px-3 py-1.5 bg-zinc-800 rounded-full">
                <span className="text-sm text-zinc-400">
                  +{stats.favorites.length - 8} more
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Recommendations */}
      <Recommendations 
        watchedFilms={mediaItems.filter(m => m.status === 'watched')} 
        allTitles={mediaItems.map(m => m.title)}
      />

      {/* Taste Analysis */}
      <TasteAnalysis films={mediaItems} />
    </div>
  );
}
