'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Plus, HelpCircle } from 'lucide-react';
import { SlotMachine } from '@/components/slot-machine';
import { AddMediaForm, MediaList, Diary, Stats, Wrapped } from '@/components/media';
import { FloatingDockMinimal, AppTour, useTour } from '@/components/ui';
import { logoutAction } from '@/lib/actions/auth';
import { useAuth } from '@/hooks/useAuth';
import type { MediaStatus } from '@/types/database';

type Tab = 'decide' | 'list' | 'diary' | 'stats' | 'wrapped';
type ListFilter = 'all' | MediaStatus;

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('decide');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const { user, isDemo } = useAuth();
  const { showTour, resetTour, setShowTour } = useTour();

  // Navigation items for floating dock
  const navItems = [
    { id: 'decide' as Tab, label: 'Decide', emoji: '🎰' },
    { id: 'list' as Tab, label: 'Watchlist', emoji: '📋' },
    { id: 'diary' as Tab, label: 'Diary', emoji: '📔' },
    { id: 'stats' as Tab, label: 'Stats', emoji: '📊' },
    // Wrapped tab only visible in December
    ...(new Date().getMonth() === 11 ? [{ id: 'wrapped' as Tab, label: 'Wrapped', emoji: '🎁' }] : []),
  ];

  return (
    <div className="min-h-screen liquid-animated">
      {/* Ambient light orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/[0.02] rounded-full blur-[80px]" />
      </div>
      
      {/* Header - Minimal glass */}
      <header className="glass-heavy sticky top-0 z-40 safe-top">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <span className="text-base font-semibold gold-shimmer">Unscroll</span>
            {user && (
              <span className={`px-2 py-0.5 text-[10px] rounded-full border ${
                isDemo 
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/20'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
              }`}>
                {isDemo ? 'Demo' : user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Primary Action: Add Film */}
            <AddMediaForm />
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
            
            {/* Secondary Actions: Help */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetTour}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:bg-white/5 transition-all"
              title="Restart Tour"
            >
              <HelpCircle className="w-4 h-4" />
            </motion.button>
            
            {/* Logout */}
            <form action={async () => { await logoutAction(); }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl flex items-center justify-center gap-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Logout</span>
              </motion.button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content - with bottom padding for floating dock */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-28">
        <AnimatePresence mode="wait">
          {activeTab === 'decide' && (
            <motion.div
              key="decide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="text-center mb-6 sm:mb-8">
                <motion.div 
                  className="text-3xl sm:text-4xl mb-3 sm:mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  🎬
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                  Tonight&apos;s <span className="gold-shimmer">Feature</span>
                </h1>
                <p className="text-zinc-500 text-xs sm:text-sm font-light max-w-xs mx-auto">
                  Let fate choose your next cinematic experience
                </p>
              </div>

              <SlotMachine />
            </motion.div>
          )}
          
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">Your Watchlist</h1>
                <p className="text-zinc-500 text-xs sm:text-sm">
                  Everything you want to watch
                </p>
              </div>

              {/* Filter Pills - Ethereal style */}
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto py-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
                {[
                  { id: 'all' as ListFilter, label: 'All', emoji: '🎬' },
                  { id: 'unwatched' as ListFilter, label: 'To Watch', emoji: '📋' },
                  { id: 'watching' as ListFilter, label: 'Watching', emoji: '👀' },
                  { id: 'watched' as ListFilter, label: 'Watched', emoji: '✅' },
                ].map(({ id, label, emoji }) => (
                  <motion.button
                    key={id}
                    onClick={() => setListFilter(id)}
                    className={`
                      flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl transition-all
                      ${listFilter === id ? 'pill-active' : 'pill-inactive'}
                    `}
                    whileTap={{ scale: 0.95 }}
                    whileHover={listFilter !== id ? { scale: 1.05 } : {}}
                  >
                    {emoji} {label}
                  </motion.button>
                ))}
              </div>

              <MediaList filter={listFilter} />
            </motion.div>
          )}
          
          {activeTab === 'diary' && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-2 sm:gap-3">
                  <span>📔</span> Your Film Diary
                </h1>
                <p className="text-zinc-500 text-xs sm:text-sm">
                  A timeline of everything you&apos;ve watched
                </p>
              </div>

              <Diary />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Stats />
            </motion.div>
          )}

          {activeTab === 'wrapped' && (
            <motion.div
              key="wrapped"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Wrapped />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Dock Navigation */}
      <FloatingDockMinimal
        items={navItems}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as Tab)}
      />

      {/* App Tour */}
      <AppTour forceShow={showTour} onComplete={() => setShowTour(false)} />

    </div>
  );
}
