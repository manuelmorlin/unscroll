'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Film, ChevronRight, AlertCircle, Plus, X, Loader2, Check, Clock, Clapperboard, Globe, FileText, Users, Tv } from 'lucide-react';
import Image from 'next/image';
import { actionGetRecommendations, actionAutofill } from '@/lib/actions/ai';
import { searchMovies, getMovieDetails } from '@/lib/actions/tmdb';
import { addMediaItem } from '@/lib/actions/media';
import { useToast, useModal } from '@/components/ui';
import { formatGenre } from '@/lib/utils';
import type { MediaItem } from '@/types/database';

interface Recommendation {
  title: string;
  year?: number;
  reason: string;
  matchScore: number;
}

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
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
  watch_providers: WatchProvider[];
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
  const { showToast } = useToast();
  const { openModal: openDock, closeModal: closeDock } = useModal();

  // Hide floating dock when modal is open
  useEffect(() => {
    if (selectedRec) {
      openDock();
    } else {
      closeDock();
    }
  }, [selectedRec, openDock, closeDock]);

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
      // Sort recommendations by match score (highest first)
      const sortedRecommendations = [...result.data.recommendations].sort(
        (a, b) => b.matchScore - a.matchScore
      );
      setRecommendations(sortedRecommendations);
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
      // Try multiple search strategies
      let bestMatch = null;
      
      // Strategy 1: Search with title + year
      if (rec.year) {
        const searchResult = await searchMovies(`${rec.title} ${rec.year}`);
        if (searchResult.success && searchResult.movies && searchResult.movies.length > 0) {
          // Try to find exact year match
          bestMatch = searchResult.movies.find(m => 
            m.release_date && parseInt(m.release_date.split('-')[0]) === rec.year
          ) || searchResult.movies[0];
        }
      }
      
      // Strategy 2: If no match, try title only
      if (!bestMatch) {
        const searchResult = await searchMovies(rec.title);
        if (searchResult.success && searchResult.movies && searchResult.movies.length > 0) {
          bestMatch = searchResult.movies[0];
        }
      }
      
      // Strategy 3: If still no match, try without special characters
      if (!bestMatch) {
        const cleanTitle = rec.title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
        if (cleanTitle !== rec.title) {
          const searchResult = await searchMovies(cleanTitle);
          if (searchResult.success && searchResult.movies && searchResult.movies.length > 0) {
            bestMatch = searchResult.movies[0];
          }
        }
      }

      if (bestMatch) {
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
            watch_providers: detailsResult.data.watch_providers,
          });
        }
      } else {
        // Fallback: Use AI to generate details if TMDB doesn't find anything
        const aiResult = await actionAutofill(rec.title);
        if (aiResult.success && aiResult.data) {
          setMovieDetails({
            title: rec.title,
            year: aiResult.data.year || rec.year || 0,
            genre: aiResult.data.genre,
            plot: aiResult.data.plot,
            cast: aiResult.data.cast,
            director: null,
            duration: aiResult.data.duration,
            poster_url: null, // AI can't provide poster
            original_language: '',
            watch_providers: [],
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
      watch_providers: movieDetails.watch_providers,
      status: 'unwatched',
    });

    if (result.success) {
      setAddedToWatchlist(prev => new Set([...prev, movieDetails.title]));
      showToast('Film added to watchlist');
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
    {/* Movie Details Modal - Same style as FilmDetailModal */}
    <AnimatePresence>
      {selectedRec && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl bg-zinc-900 border border-zinc-800 overflow-hidden max-h-[calc(100vh-env(safe-area-inset-top))] sm:max-h-[90vh] flex flex-col mt-safe sm:mt-0"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-1 right-1.5 sm:top-2 sm:right-2 z-20 p-1 bg-black/60 hover:bg-red-900/50 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-red-500" />
            </button>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Loading film details...</p>
                </div>
              </div>
            ) : movieDetails ? (
              <div className="overflow-y-auto flex-1 scrollbar-hide">
                {/* Hero Section with Poster */}
                <div className="relative">
                  {/* Backdrop blur from poster */}
                  {movieDetails.poster_url && (
                    <div className="absolute inset-0 h-full overflow-hidden">
                      <Image
                        src={movieDetails.poster_url}
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
                      {movieDetails.poster_url ? (
                        <div className="relative flex-shrink-0 w-32 sm:w-40 aspect-[2/3] rounded-xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl">
                          <Image
                            src={movieDetails.poster_url}
                            alt={movieDetails.title}
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
                          {movieDetails.title}
                        </h2>
                        
                        {/* Year & Duration & Language */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-3">
                          {movieDetails.year && (
                            <span className="font-medium">{movieDetails.year}</span>
                          )}
                          {movieDetails.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {movieDetails.duration}
                            </span>
                          )}
                          {movieDetails.original_language && (
                            <span className="flex items-center gap-1 uppercase">
                              <Globe className="w-3.5 h-3.5" />
                              {movieDetails.original_language}
                            </span>
                          )}
                        </div>

                        {/* Director */}
                        {movieDetails.director && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                            <Clapperboard className="w-3.5 h-3.5" />
                            <span>Directed by <span className="text-zinc-200 font-medium">{movieDetails.director}</span></span>
                          </div>
                        )}
                        
                        {/* Genres */}
                        {movieDetails.genre && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {formatGenre(movieDetails.genre).split('/').map((g, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-xs font-medium text-yellow-400"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Match Score */}
                        <div className="mt-auto">
                          <div className="px-3 py-1.5 bg-yellow-500/20 rounded-lg inline-block">
                            <span className="text-sm font-medium text-yellow-400">
                              {selectedRec.matchScore}% Match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="px-5 sm:px-6 pb-6 space-y-5">
                  {/* AI Reason */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-zinc-800/50 rounded-xl">
                    <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-zinc-300">{selectedRec.reason}</p>
                  </div>

                  {/* Plot */}
                  {movieDetails.plot && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-500" />
                        Plot
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {movieDetails.plot}
                      </p>
                    </div>
                  )}

                  {/* Cast */}
                  {movieDetails.cast && movieDetails.cast.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        Cast
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {movieDetails.cast.map((actor, i) => (
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
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                      <Tv className="w-4 h-4 text-zinc-500" />
                      Where to Watch
                    </h3>
                    {movieDetails.watch_providers && movieDetails.watch_providers.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          {movieDetails.watch_providers.map((provider) => (
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
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No streaming options available in Italy</p>
                    )}
                  </div>

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
              </div>
            ) : (
              <div className="p-6 text-center py-12">
                <AlertCircle className="w-10 h-10 text-amber-500/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">{selectedRec.title}</h3>
                {selectedRec.year && (
                  <p className="text-sm text-zinc-500 mb-3">{selectedRec.year}</p>
                )}
                <p className="text-sm text-zinc-400 mb-2">Details not available on TMDB</p>
                <p className="text-xs text-zinc-500 mb-6 max-w-sm mx-auto">
                  This film may have a different title in the database, or it&apos;s not listed yet.
                </p>
                
                {/* AI Recommendation reason */}
                <div className="glass rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Why recommended</p>
                  <p className="text-sm text-zinc-300">{selectedRec.reason}</p>
                </div>

                {/* Add anyway button */}
                {addedToWatchlist.has(selectedRec.title) ? (
                  <button
                    disabled
                    className="w-full py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-medium rounded-xl flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Added to Watchlist
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setIsAdding(true);
                      const result = await addMediaItem({
                        title: selectedRec.title,
                        year: selectedRec.year || null,
                        format: 'movie',
                        genre: null,
                        plot: null,
                        cast: null,
                        director: null,
                        duration: null,
                        poster_url: null,
                        original_language: null,
                        watch_providers: null,
                      });
                      if (result.success) {
                        showToast(`${selectedRec.title} added to watchlist!`, 'success');
                        setAddedToWatchlist(prev => new Set([...prev, selectedRec.title]));
                      } else {
                        showToast(result.error || 'Failed to add to watchlist', 'error');
                      }
                      setIsAdding(false);
                    }}
                    disabled={isAdding}
                    className="w-full py-3 bg-gradient-to-r from-amber-500/80 to-yellow-500/80 hover:from-amber-400 hover:to-yellow-400 text-black font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add Anyway (without details)
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={closeModal}
                  className="mt-3 w-full py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
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
