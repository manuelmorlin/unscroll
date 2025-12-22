'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Film, ChevronRight, AlertCircle, Plus, X, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { actionGetRecommendations } from '@/lib/actions/ai';
import { searchMovies, getMovieDetails } from '@/lib/actions/tmdb';
import { addMediaItem } from '@/lib/actions/media';
import type { MediaItem } from '@/types/database';

interface Recommendation {
  title: string;
  year?: number;
  reason: string;
  matchScore: number;
}

interface MovieDetails {
  title: string;
  year: number;
  genre: string;
  plot: string;
  cast: string[];
  director: string | null;
  duration: string;
  poster_url: string | null;
  original_language: string;
}

interface RecommendationsProps {
  watchedFilms: MediaItem[];
  allTitles: string[];
}

export function Recommendations({ watchedFilms, allTitles }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState<Set<string>>(new Set());

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filmData = watchedFilms
      .filter(f => f.status === 'watched')
      .map(f => ({
        title: f.title,
        genre: f.genre,
        rating: f.user_rating,
        year: f.year,
      }));

    const result = await actionGetRecommendations(filmData, allTitles);

    if (result.success && result.data) {
      setRecommendations(result.data.recommendations);
      setAnalysis(result.data.analysis);
    } else {
      setError(result.error || 'Failed to get recommendations');
    }

    setIsLoading(false);
  }, [watchedFilms, allTitles]);

  // Fetch movie details when clicking on a recommendation
  const handleRecClick = async (rec: Recommendation) => {
    setSelectedRec(rec);
    setMovieDetails(null);
    setIsLoadingDetails(true);

    try {
      // Search for the movie on TMDB
      const searchQuery = rec.year ? `${rec.title} ${rec.year}` : rec.title;
      const searchResult = await searchMovies(searchQuery);
      
      if (searchResult.success && searchResult.movies && searchResult.movies.length > 0) {
        // Get the first match (or best match by year)
        let bestMatch = searchResult.movies[0];
        if (rec.year) {
          const exactMatch = searchResult.movies.find(m => 
            m.release_date && parseInt(m.release_date.split('-')[0]) === rec.year
          );
          if (exactMatch) bestMatch = exactMatch;
        }

        // Get full details
        const detailsResult = await getMovieDetails(bestMatch.id);
        if (detailsResult.success && detailsResult.data) {
          setMovieDetails({
            title: bestMatch.title,
            year: detailsResult.data.year,
            genre: detailsResult.data.genre,
            plot: detailsResult.data.plot,
            cast: detailsResult.data.cast,
            director: detailsResult.data.director,
            duration: detailsResult.data.duration,
            poster_url: detailsResult.data.poster_url,
            original_language: detailsResult.data.original_language,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching movie details:', err);
    }

    setIsLoadingDetails(false);
  };

  // Add to watchlist
  const handleAddToWatchlist = async () => {
    if (!movieDetails) return;
    
    setIsAdding(true);
    
    const result = await addMediaItem({
      title: movieDetails.title,
      genre: movieDetails.genre,
      plot: movieDetails.plot,
      cast: movieDetails.cast,
      director: movieDetails.director,
      duration: movieDetails.duration,
      year: movieDetails.year,
      poster_url: movieDetails.poster_url,
      original_language: movieDetails.original_language,
      status: 'unwatched',
    });

    if (result.success) {
      setAddedToWatchlist(prev => new Set([...prev, movieDetails.title]));
      // Close modal after short delay to show success
      setTimeout(() => {
        setSelectedRec(null);
        setMovieDetails(null);
      }, 1000);
    }

    setIsAdding(false);
  };

  const closeModal = () => {
    setSelectedRec(null);
    setMovieDetails(null);
  };

  return (
    <>
    {/* Movie Details Modal */}
    <AnimatePresence>
      {selectedRec && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Loading film details...</p>
                </div>
              </div>
            ) : movieDetails ? (
              <>
                {/* Header with poster */}
                <div className="relative">
                  {movieDetails.poster_url ? (
                    <div className="relative h-64 w-full">
                      <Image
                        src={movieDetails.poster_url}
                        alt={movieDetails.title}
                        fill
                        className="object-cover rounded-t-2xl"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-b from-yellow-600/20 to-zinc-900 rounded-t-2xl" />
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-2xl font-bold text-white mb-1">{movieDetails.title}</h2>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <span>{movieDetails.year}</span>
                      {movieDetails.duration && <span>• {movieDetails.duration}</span>}
                      {movieDetails.director && <span>• {movieDetails.director}</span>}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Match score badge */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-yellow-500/20 rounded-lg">
                      <span className="text-sm font-medium text-yellow-400">
                        {selectedRec.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 flex-1">{selectedRec.reason}</p>
                  </div>

                  {/* Genre */}
                  {movieDetails.genre && (
                    <div className="flex flex-wrap gap-2">
                      {movieDetails.genre.split(', ').map((g) => (
                        <span key={g} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Plot */}
                  {movieDetails.plot && (
                    <p className="text-sm text-zinc-300 leading-relaxed">{movieDetails.plot}</p>
                  )}

                  {/* Cast */}
                  {movieDetails.cast && movieDetails.cast.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Cast</p>
                      <p className="text-sm text-zinc-300">{movieDetails.cast.slice(0, 5).join(', ')}</p>
                    </div>
                  )}

                  {/* Add to Watchlist button */}
                  {addedToWatchlist.has(movieDetails.title) ? (
                    <button
                      disabled
                      className="w-full py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-medium rounded-xl flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Added to Watchlist
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToWatchlist}
                      disabled={isAdding}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add to Watchlist
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Could not find details for this film</p>
                <button
                  onClick={closeModal}
                  className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-medium text-white">AI Recommendations</h3>
        </div>
        {recommendations && (
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!recommendations && !isLoading && !error && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-400 mb-4">
            Get personalized film recommendations based on your taste
          </p>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading || watchedFilms.filter(f => f.user_rating && f.user_rating >= 3).length < 3}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Get Recommendations
          </button>
          {watchedFilms.filter(f => f.user_rating && f.user_rating >= 3).length < 3 && (
            <p className="text-xs text-zinc-500 mt-2">
              Rate at least 3 films to get recommendations
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            </motion.div>
            <p className="text-sm text-zinc-400">Analyzing your taste...</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {recommendations && (
        <div className="space-y-3">
          {analysis && (
            <p className="text-xs text-zinc-400 italic mb-3 px-2">
              &quot;{analysis}&quot;
            </p>
          )}
          
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleRecClick(rec)}
              className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {rec.title}
                  </p>
                  {rec.year && (
                    <span className="text-xs text-zinc-500">({rec.year})</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate">{rec.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                {addedToWatchlist.has(rec.title) && (
                  <div className="px-2 py-1 bg-green-500/20 rounded text-xs font-medium text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Added
                  </div>
                )}
                <div className="px-2 py-1 bg-yellow-500/20 rounded text-xs font-medium text-yellow-400">
                  {rec.matchScore}%
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    </>
  );
}
