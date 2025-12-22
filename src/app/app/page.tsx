'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Plus } from 'lucide-react';
import { SlotMachine } from '@/components/slot-machine';
import { AddMediaForm, MediaList, Diary, Stats, Wrapped } from '@/components/media';
import { FloatingDockMinimal } from '@/components/ui';
import { logoutAction } from '@/lib/actions/auth';
import { useAuth } from '@/hooks/useAuth';
import type { MediaStatus } from '@/types/database';

type Tab = 'decide' | 'list' | 'diary' | 'stats' | 'wrapped';
type ListFilter = 'all' | MediaStatus;

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('decide');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const { user, isDemo } = useAuth();

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
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <span className="text-base font-semibold gold-shimmer">Unscroll</span>
            {isDemo && (
              <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/20">
                Demo
              </span>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-300">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center border border-amber-400/20">
                <User className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="font-medium">
                {user?.displayName || 'User'}
              </span>
            </div>
            <form action={async () => { await logoutAction(); }}>
              <button
                type="submit"
                className="btn-glass flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition-all font-medium"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
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
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
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

      {/* Floating Add Button - positioned for thumb reach on mobile */}
      <motion.div 
        className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <AddMediaForm />
      </motion.div>
    </div>
  );
}
