'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { SlotMachine } from '@/components/slot-machine';
import { AddMediaForm, MediaList, Diary } from '@/components/media';
import { logoutAction } from '@/lib/actions/auth';
import { useAuth } from '@/hooks/useAuth';
import type { MediaStatus } from '@/types/database';

type Tab = 'decide' | 'list' | 'diary';
type ListFilter = 'all' | MediaStatus;

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('decide');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const { user, isDemo } = useAuth();

  return (
    <div className="min-h-screen cinema-bg flex flex-col">
      {/* Subtle curtain effects - hide on small screens for performance */}
      <div className="hidden sm:block fixed left-0 top-0 bottom-0 w-16 curtain-left pointer-events-none opacity-50" />
      <div className="hidden sm:block fixed right-0 top-0 bottom-0 w-16 curtain-right pointer-events-none opacity-50" />
      
      {/* Header - with safe area */}
      <header className="border-b border-red-900/30 bg-black/80 backdrop-blur-md sticky top-0 z-40 safe-top">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-base font-semibold gold-shimmer">Unscroll</span>
            {isDemo && (
              <span className="px-1.5 py-0.5 text-[10px] bg-violet-500/20 text-violet-400 rounded-full">
                Demo
              </span>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <AddMediaForm />
            <div className="hidden sm:block w-px h-6 bg-zinc-700" />
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-200">
              <User className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">
                {user?.displayName || 'User'}
              </span>
            </div>
            <form action={async () => { await logoutAction(); }}>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 rounded-xl transition-colors font-medium min-w-[44px]"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tab Navigation - larger touch targets */}
      <div className="border-b border-red-900/30 bg-black/40">
        <div className="max-w-4xl mx-auto px-2">
          <nav className="flex">
            {[
              { id: 'decide' as Tab, label: 'Decide', emoji: '🎰' },
              { id: 'list' as Tab, label: 'Watchlist', emoji: '📋' },
              { id: 'diary' as Tab, label: 'Diary', emoji: '📔' },
            ].map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3.5 text-sm font-medium border-b-2 transition-colors active:bg-white/5 ${
                  activeTab === id
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-zinc-400'
                }`}
              >
                <span className="text-base">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - flex-1 to push footer down */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {activeTab === 'decide' && (
          <motion.div
            key="decide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🎬</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Tonight&apos;s <span className="gold-shimmer">Feature</span>
              </h1>
              <p className="text-zinc-400 text-sm font-light max-w-xs mx-auto">
                Let fate choose your next cinematic experience.
              </p>
            </div>

            <SlotMachine />
          </motion.div>
        )}
        
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-5">
              <h1 className="text-xl font-bold text-white mb-0.5">Your Watchlist</h1>
              <p className="text-zinc-400 text-sm">
                Everything you want to watch
              </p>
            </div>

            {/* Filter Pills - horizontal scroll on mobile */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {[
                { id: 'all' as ListFilter, label: 'All', emoji: '🎬' },
                { id: 'unwatched' as ListFilter, label: 'To Watch', emoji: '🎯' },
                { id: 'watching' as ListFilter, label: 'Watching', emoji: '👀' },
                { id: 'watched' as ListFilter, label: 'Watched', emoji: '✅' },
              ].map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setListFilter(id)}
                  className={`flex-shrink-0 px-4 py-2.5 text-sm rounded-full transition-all duration-200 active:scale-95 ${
                    listFilter === id
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-medium shadow-lg shadow-yellow-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            <MediaList filter={listFilter} />
          </motion.div>
        )}
        
        {activeTab === 'diary' && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-5">
              <h1 className="text-xl font-bold text-white mb-0.5 flex items-center gap-2">
                <span>📔</span> Your Film Diary
              </h1>
              <p className="text-zinc-400 text-sm">
                A timeline of everything you&apos;ve watched
              </p>
            </div>

            <Diary />
          </motion.div>
        )}
      </main>

      {/* Footer - with safe area */}
      <footer className="border-t border-red-900/30 bg-black/40 safe-bottom">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-zinc-500 whitespace-nowrap">
          Made with 🍿 for movie lovers · <a
            href="https://github.com/manuelmorlin/unscroll"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-500/70 hover:text-yellow-400 transition-colors"
          >View Source</a>
        </div>
      </footer>
    </div>
  );
}
