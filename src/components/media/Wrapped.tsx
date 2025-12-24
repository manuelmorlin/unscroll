'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Film, Clock, Star, Trophy, Calendar, Clapperboard, Brain, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useMediaItems } from '@/hooks/useMediaItems';
import { actionGetWrappedInsights } from '@/lib/actions/ai';
import type { MediaItem } from '@/types/database';

// ==============================================
// TYPES
// ==============================================

interface WrappedStats {
  totalFilms: number;
  totalMinutes: number;
  totalHours: number;
  topGenre: { name: string; count: number } | null;
  topDirector: { name: string; count: number } | null;
  topRatedFilms: MediaItem[];
  mostWatchedMonth: { name: string; count: number } | null;
  avgRating: number | null;
  totalRewatches: number;
  favoriteLanguage: { name: string; count: number } | null;
  longestFilm: MediaItem | null;
  shortestFilm: MediaItem | null;
  films: MediaItem[];
}

interface AIInsights {
  personality: string;
  spiritAnimal: { director: string; reason: string };
  prediction2026: string;
  roast: string;
  compliment: string;
}

// ==============================================
// SLIDE COMPONENTS
// ==============================================

const GRADIENT_CLASSES = [
  'from-red-600 via-red-800 to-black',
  'from-purple-600 via-purple-900 to-black',
  'from-blue-600 via-blue-900 to-black',
  'from-green-600 via-green-900 to-black',
  'from-orange-500 via-orange-800 to-black',
  'from-pink-600 via-pink-900 to-black',
  'from-cyan-500 via-cyan-800 to-black',
  'from-yellow-500 via-amber-800 to-black',
];

interface SlideProps {
  children: React.ReactNode;
  gradient?: string;
}

function Slide({ children, gradient = GRADIENT_CLASSES[0] }: SlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-b ${gradient}`}
    >
      {children}
    </motion.div>
  );
}

// ==============================================
// INTRO SLIDE
// ==============================================

function IntroSlide({ year }: { year: number }) {
  return (
    <Slide gradient="from-red-700 via-red-900 to-black">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          🎬
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">
          Your {year}
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400">
          Film Wrapped
        </h2>
        <p className="text-zinc-400 mt-6 text-lg">
          Let&apos;s see what you watched this year
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// TOTAL FILMS SLIDE
// ==============================================

function TotalFilmsSlide({ stats }: { stats: WrappedStats }) {
  return (
    <Slide gradient="from-purple-600 via-purple-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Film className="w-16 h-16 text-purple-300 mx-auto mb-6" />
        <p className="text-purple-200 text-xl mb-4">You watched</p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="text-8xl sm:text-9xl font-black text-white mb-4"
        >
          {stats.totalFilms}
        </motion.div>
        <p className="text-2xl text-purple-200">
          film{stats.totalFilms !== 1 ? 's' : ''} this year
        </p>
        {stats.totalRewatches > 0 && (
          <p className="text-purple-400 mt-4">
            + {stats.totalRewatches} rewatch{stats.totalRewatches !== 1 ? 'es' : ''}
          </p>
        )}
      </motion.div>
    </Slide>
  );
}

// ==============================================
// WATCH TIME SLIDE
// ==============================================

function WatchTimeSlide({ stats }: { stats: WrappedStats }) {
  const days = Math.floor(stats.totalHours / 24);
  const hours = Math.round(stats.totalHours % 24);
  
  return (
    <Slide gradient="from-blue-600 via-blue-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Clock className="w-16 h-16 text-blue-300 mx-auto mb-6" />
        <p className="text-blue-200 text-xl mb-4">You spent</p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          {days > 0 ? (
            <>
              <span className="text-7xl sm:text-8xl font-black text-white">{days}</span>
              <span className="text-3xl text-blue-200 ml-2">day{days !== 1 ? 's' : ''}</span>
              <span className="text-5xl sm:text-6xl font-black text-white ml-4">{hours}</span>
              <span className="text-2xl text-blue-200 ml-2">hr{hours !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <span className="text-8xl sm:text-9xl font-black text-white">{Math.round(stats.totalHours)}</span>
              <span className="text-3xl text-blue-200 ml-2">hours</span>
            </>
          )}
        </motion.div>
        <p className="text-xl text-blue-200">watching movies</p>
        <p className="text-blue-400 mt-4 text-sm">
          That&apos;s {stats.totalMinutes.toLocaleString()} minutes of cinema magic ✨
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// TOP GENRE SLIDE
// ==============================================

function TopGenreSlide({ stats }: { stats: WrappedStats }) {
  if (!stats.topGenre) return null;
  
  const genreEmojis: Record<string, string> = {
    'Action': '💥', 'Adventure': '🌍', 'Animation': '🎨', 'Comedy': '😂',
    'Crime': '🔫', 'Documentary': '📹', 'Drama': '🎭', 'Family': '👨‍👩‍👧‍👦',
    'Fantasy': '🧙', 'Horror': '👻', 'Music': '🎵', 'Mystery': '🕵️',
    'Romance': '💕', 'Science Fiction': '🚀', 'Thriller': '🔍', 'War': '⚔️',
  };
  
  const emoji = genreEmojis[stats.topGenre.name] || '🎬';
  
  return (
    <Slide gradient="from-green-600 via-green-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          {emoji}
        </motion.div>
        <p className="text-green-200 text-xl mb-4">Your top genre was</p>
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-5xl sm:text-6xl font-black text-white mb-4"
        >
          {stats.topGenre.name}
        </motion.h2>
        <p className="text-green-300 text-lg">
          You watched {stats.topGenre.count} {stats.topGenre.name.toLowerCase()} film{stats.topGenre.count !== 1 ? 's' : ''}
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// TOP DIRECTOR SLIDE
// ==============================================

function TopDirectorSlide({ stats }: { stats: WrappedStats }) {
  if (!stats.topDirector) return null;
  
  return (
    <Slide gradient="from-orange-500 via-orange-800 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Clapperboard className="w-16 h-16 text-orange-300 mx-auto mb-6" />
        <p className="text-orange-200 text-xl mb-4">Your favorite director</p>
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-4xl sm:text-5xl font-black text-white mb-4"
        >
          {stats.topDirector.name}
        </motion.h2>
        <p className="text-orange-300 text-lg">
          You watched {stats.topDirector.count} of their film{stats.topDirector.count !== 1 ? 's' : ''}
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// TOP RATED FILM SLIDE
// ==============================================

function TopRatedSlide({ stats }: { stats: WrappedStats }) {
  if (stats.topRatedFilms.length === 0) return null;
  
  const isSingleFilm = stats.topRatedFilms.length === 1;
  const rating = stats.topRatedFilms[0]?.user_rating || 0;
  
  return (
    <Slide gradient="from-yellow-500 via-amber-800 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
        <p className="text-yellow-200 text-xl mb-4">
          {isSingleFilm ? 'Your favorite film' : `Your ${stats.topRatedFilms.length} favorite films`}
        </p>
        
        {isSingleFilm ? (
          // Single film layout
          <>
            {stats.topRatedFilms[0].poster_url && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative w-40 h-60 mx-auto mb-4 rounded-xl overflow-hidden shadow-2xl"
              >
                <Image
                  src={stats.topRatedFilms[0].poster_url}
                  alt={stats.topRatedFilms[0].title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </motion.div>
            )}
            
            <motion.h2
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-3xl sm:text-4xl font-black text-white mb-2"
            >
              {stats.topRatedFilms[0].title}
            </motion.h2>
          </>
        ) : (
          // Multiple films grid layout
          <>
            <div className={`grid gap-3 mb-4 ${stats.topRatedFilms.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} max-w-xs sm:max-w-md mx-auto`}>
              {stats.topRatedFilms.slice(0, 6).map((film, index) => (
                <motion.div
                  key={film.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  {film.poster_url && (
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-xl mb-2">
                      <Image
                        src={film.poster_url}
                        alt={film.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-white text-xs font-medium truncate px-1">{film.title}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
        
        <div className="flex items-center justify-center gap-1 text-yellow-400 text-2xl">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${i < rating ? 'fill-yellow-400' : 'fill-none'}`}
            />
          ))}
        </div>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// BUSIEST MONTH SLIDE
// ==============================================

function BusiestMonthSlide({ stats }: { stats: WrappedStats }) {
  if (!stats.mostWatchedMonth) return null;
  
  return (
    <Slide gradient="from-pink-600 via-pink-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Calendar className="w-16 h-16 text-pink-300 mx-auto mb-6" />
        <p className="text-pink-200 text-xl mb-4">You binged the most in</p>
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-5xl sm:text-6xl font-black text-white mb-4"
        >
          {stats.mostWatchedMonth.name}
        </motion.h2>
        <p className="text-pink-300 text-lg">
          {stats.mostWatchedMonth.count} film{stats.mostWatchedMonth.count !== 1 ? 's' : ''} watched
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// LANGUAGE SLIDE
// ==============================================

function LanguageSlide({ stats }: { stats: WrappedStats }) {
  if (!stats.favoriteLanguage) return null;
  
  const languageNames: Record<string, string> = {
    'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
    'pt': 'Portuguese', 'ru': 'Russian', 'hi': 'Hindi', 'ar': 'Arabic',
  };
  
  const languageFlags: Record<string, string> = {
    'en': '🇺🇸', 'it': '🇮🇹', 'es': '🇪🇸', 'fr': '🇫🇷',
    'de': '🇩🇪', 'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳',
    'pt': '🇧🇷', 'ru': '🇷🇺', 'hi': '🇮🇳', 'ar': '🇸🇦',
  };
  
  const langCode = stats.favoriteLanguage.name.toLowerCase();
  const langName = languageNames[langCode] || stats.favoriteLanguage.name.toUpperCase();
  const flag = languageFlags[langCode] || '🌍';
  
  return (
    <Slide gradient="from-cyan-500 via-cyan-800 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          {flag}
        </motion.div>
        <p className="text-cyan-200 text-xl mb-4">Your top language was</p>
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-5xl sm:text-6xl font-black text-white mb-4"
        >
          {langName}
        </motion.h2>
        <p className="text-cyan-300 text-lg">
          {stats.favoriteLanguage.count} film{stats.favoriteLanguage.count !== 1 ? 's' : ''}
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// AI INSIGHTS SLIDE
// ==============================================

function AIInsightsSlide({ insights }: { insights: AIInsights }) {
  return (
    <Slide gradient="from-purple-600 via-violet-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-purple-300" />
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
        <p className="text-purple-200 text-lg mb-4">AI says you&apos;re...</p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-white leading-relaxed mb-6 px-4"
        >
          &quot;{insights.personality}&quot;
        </motion.p>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 rounded-xl p-4 mb-4"
        >
          <p className="text-purple-300 text-xs mb-1">Your Spirit Director</p>
          <p className="text-xl font-bold text-white">{insights.spiritAnimal.director}</p>
          <p className="text-sm text-purple-200 mt-1">{insights.spiritAnimal.reason}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3 text-left px-4"
        >
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">🔮</span>
            <p className="text-sm text-purple-200">{insights.prediction2026}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-pink-400">😏</span>
            <p className="text-sm text-purple-200 italic">{insights.roast}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">💚</span>
            <p className="text-sm text-purple-200">{insights.compliment}</p>
          </div>
        </motion.div>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// SUMMARY SLIDE
// ==============================================

function SummarySlide({ stats, year }: { stats: WrappedStats; year: number }) {
  return (
    <Slide gradient="from-red-700 via-red-900 to-black">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center w-full max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🎬
        </motion.div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
          Your {year} in Film
        </h2>
        
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Films</p>
            <p className="text-2xl font-bold text-white">{stats.totalFilms}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Hours</p>
            <p className="text-2xl font-bold text-white">{Math.round(stats.totalHours)}</p>
          </div>
          {stats.topGenre && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-zinc-400 text-xs mb-1">Top Genre</p>
              <p className="text-lg font-bold text-white truncate">{stats.topGenre.name}</p>
            </div>
          )}
          {stats.avgRating && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-zinc-400 text-xs mb-1">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-400">⭐ {stats.avgRating.toFixed(1)}</p>
            </div>
          )}
        </div>
        
        <p className="text-zinc-400 mt-6 text-sm">
          See you at the movies in {year + 1}! 🍿
        </p>
      </motion.div>
    </Slide>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export function Wrapped() {
  const { mediaItems, isLoading } = useMediaItems();
  const [currentSlide, setCurrentSlide] = useState(0);
  const year = new Date().getFullYear();

  // Calculate stats with useMemo
  const stats = useMemo((): WrappedStats | null => {
    if (isLoading || mediaItems.length === 0) return null;

    const watchedThisYear = mediaItems.filter((item) => {
      if (item.status !== 'watched' || !item.watched_at) return false;
      const watchedYear = new Date(item.watched_at).getFullYear();
      return watchedYear === year;
    });

    if (watchedThisYear.length === 0) {
      return null;
    }

    // Total minutes calculation
    let totalMinutes = 0;
    watchedThisYear.forEach((item) => {
      if (item.duration) {
        const match = item.duration.match(/(\d+)h\s*(\d+)?m?|(\d+)m/);
        if (match) {
          const hours = parseInt(match[1] || '0', 10);
          const mins = parseInt(match[2] || match[3] || '0', 10);
          totalMinutes += hours * 60 + mins;
        }
      }
    });

    // Genre count
    const genreCount: Record<string, number> = {};
    watchedThisYear.forEach((item) => {
      if (item.genre) {
        const genres = item.genre.split(/,|\//).map((g) => g.trim());
        genres.forEach((g) => {
          genreCount[g] = (genreCount[g] || 0) + 1;
        });
      }
    });
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0];

    // Director count
    const directorCount: Record<string, number> = {};
    watchedThisYear.forEach((item) => {
      if (item.director) {
        directorCount[item.director] = (directorCount[item.director] || 0) + 1;
      }
    });
    const topDirector = Object.entries(directorCount).sort((a, b) => b[1] - a[1])[0];

    // Language count
    const languageCount: Record<string, number> = {};
    watchedThisYear.forEach((item) => {
      if (item.original_language) {
        languageCount[item.original_language] = (languageCount[item.original_language] || 0) + 1;
      }
    });
    const favoriteLanguage = Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0];

    // Top rated films - handle ties by watches in the current year
    const ratedFilms = watchedThisYear.filter((item) => item.user_rating);
    let topRatedFilms: MediaItem[] = [];
    if (ratedFilms.length > 0) {
      const maxRating = Math.max(...ratedFilms.map((f) => f.user_rating || 0));
      const topRated = ratedFilms.filter((f) => f.user_rating === maxRating);
      
      if (topRated.length === 1) {
        topRatedFilms = topRated;
      } else {
        // Tie-breaker: count watches in this year (first watch + rewatches in year)
        const getWatchesInYear = (item: MediaItem) => {
          let count = 0;
          // Count the first watch if it's in this year
          if (item.watched_at) {
            const watchedYear = new Date(item.watched_at).getFullYear();
            if (watchedYear === year) count++;
          }
          // Count rewatches in this year
          if (item.rewatch_dates) {
            item.rewatch_dates.forEach((date) => {
              const rewatchYear = new Date(date).getFullYear();
              if (rewatchYear === year) count++;
            });
          }
          return count;
        };
        
        const topRatedWithYearCount = topRated.map((f) => ({
          film: f,
          yearWatches: getWatchesInYear(f),
        }));
        
        const maxYearWatches = Math.max(...topRatedWithYearCount.map((f) => f.yearWatches));
        topRatedFilms = topRatedWithYearCount
          .filter((f) => f.yearWatches === maxYearWatches)
          .map((f) => f.film);
      }
    }

    // Average rating
    const avgRating = ratedFilms.length > 0
      ? ratedFilms.reduce((sum, item) => sum + (item.user_rating || 0), 0) / ratedFilms.length
      : null;

    // Most watched month
    const monthCount: Record<string, number> = {};
    watchedThisYear.forEach((item) => {
      if (item.watched_at) {
        const month = new Date(item.watched_at).toLocaleDateString('en-US', { month: 'long' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      }
    });
    const mostWatchedMonth = Object.entries(monthCount).sort((a, b) => b[1] - a[1])[0];

    // Total rewatches in this year
    let totalRewatches = 0;
    watchedThisYear.forEach((item) => {
      if (item.rewatch_dates) {
        item.rewatch_dates.forEach((date) => {
          if (new Date(date).getFullYear() === year) {
            totalRewatches++;
          }
        });
      }
    });
    // Also count rewatches for films first watched in previous years but rewatched this year
    mediaItems.forEach((item) => {
      if (item.status === 'watched' && item.watched_at) {
        const firstWatchYear = new Date(item.watched_at).getFullYear();
        // If first watch was not this year, count rewatches in this year
        if (firstWatchYear !== year && item.rewatch_dates) {
          item.rewatch_dates.forEach((date) => {
            if (new Date(date).getFullYear() === year) {
              totalRewatches++;
            }
          });
        }
      }
    });

    // Longest and shortest films
    const filmsWithDuration = watchedThisYear.filter((item) => item.duration);
    const parseDuration = (d: string) => {
      const match = d.match(/(\d+)h\s*(\d+)?m?|(\d+)m/);
      if (!match) return 0;
      return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || match[3] || '0', 10);
    };
    const longestFilm = [...filmsWithDuration].sort((a, b) => parseDuration(b.duration!) - parseDuration(a.duration!))[0];
    const shortestFilm = [...filmsWithDuration].sort((a, b) => parseDuration(a.duration!) - parseDuration(b.duration!))[0];

    return {
      totalFilms: watchedThisYear.length,
      totalMinutes,
      totalHours: totalMinutes / 60,
      topGenre: topGenre ? { name: topGenre[0], count: topGenre[1] } : null,
      topDirector: topDirector && topDirector[1] > 1 ? { name: topDirector[0], count: topDirector[1] } : null,
      topRatedFilms,
      mostWatchedMonth: mostWatchedMonth ? { name: mostWatchedMonth[0], count: mostWatchedMonth[1] } : null,
      avgRating,
      totalRewatches,
      favoriteLanguage: favoriteLanguage ? { name: favoriteLanguage[0], count: favoriteLanguage[1] } : null,
      longestFilm: longestFilm || null,
      shortestFilm: shortestFilm || null,
      films: watchedThisYear,
    };
  }, [mediaItems, isLoading, year]);

  // AI Insights state
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Fetch AI insights when stats are ready
  useEffect(() => {
    if (!stats || aiInsights || isLoadingInsights) return;

    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      
      // Prepare data for AI
      const topGenres = stats.topGenre ? [stats.topGenre.name] : [];
      const topDirectors = stats.topDirector ? [stats.topDirector.name] : [];
      const topRatedTitles = stats.topRatedFilms.map(f => f.title);
      
      const result = await actionGetWrappedInsights({
        totalFilms: stats.totalFilms,
        totalHours: stats.totalHours,
        topGenres,
        topDirectors,
        avgRating: stats.avgRating || 3,
        topRatedFilms: topRatedTitles,
        mostWatchedMonth: stats.mostWatchedMonth?.name || 'Unknown',
        favoriteLanguage: stats.favoriteLanguage?.name || 'en',
      });

      if (result.success && result.data) {
        setAIInsights(result.data);
      }
      
      setIsLoadingInsights(false);
    };

    fetchInsights();
  }, [stats, aiInsights, isLoadingInsights]);

  // Build slides array
  const slides = stats ? [
    <IntroSlide key="intro" year={year} />,
    <TotalFilmsSlide key="total" stats={stats} />,
    stats.totalMinutes > 0 && <WatchTimeSlide key="time" stats={stats} />,
    stats.topGenre && <TopGenreSlide key="genre" stats={stats} />,
    stats.topDirector && <TopDirectorSlide key="director" stats={stats} />,
    stats.favoriteLanguage && <LanguageSlide key="language" stats={stats} />,
    stats.mostWatchedMonth && <BusiestMonthSlide key="month" stats={stats} />,
    stats.topRatedFilms.length > 0 && <TopRatedSlide key="toprated" stats={stats} />,
    aiInsights && <AIInsightsSlide key="ai-insights" insights={aiInsights} />,
    <SummarySlide key="summary" stats={stats} year={year} />,
  ].filter(Boolean) : [];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🎬
          </motion.div>
          <p className="text-zinc-400">Loading your wrapped...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">📽️</div>
          <h2 className="text-2xl font-bold text-white mb-2">No films watched in {year}</h2>
          <p className="text-zinc-400">
            Watch some films and come back to see your wrapped!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main Container */}
      <div 
        className="relative aspect-[9/16] sm:aspect-[9/14] rounded-2xl overflow-hidden shadow-2xl"
        onClick={nextSlide}
      >
        <AnimatePresence mode="wait">
          {slides[currentSlide]}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentSlide ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          disabled={currentSlide === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white disabled:opacity-0 transition-all z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          disabled={currentSlide === slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white disabled:opacity-0 transition-all z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Tap zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-5" onClick={(e) => { e.stopPropagation(); prevSlide(); }} />
        <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-5" onClick={(e) => { e.stopPropagation(); nextSlide(); }} />
      </div>
    </div>
  );
}
