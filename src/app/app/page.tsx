'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, List, LogOut, User, Film, Eye, Check } from 'lucide-react';
import { SlotMachine } from '@/components/slot-machine';
import { AddMediaForm, MediaList } from '@/components/media';
import { logoutAction } from '@/lib/actions/auth';
import { useAuth } from '@/hooks/useAuth';
import type { MediaStatus } from '@/types/database';

type Tab = 'decide' | 'list';
type ListFilter = 'all' | MediaStatus;

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('decide');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const { user, isDemo } = useAuth();

  return (
    <div className="min-h-screen cinema-bg">
      {/* Subtle curtain effects */}
      <div className="fixed left-0 top-0 bottom-0 w-16 curtain-left pointer-events-none opacity-50" />
      <div className="fixed right-0 top-0 bottom-0 w-16 curtain-right pointer-events-none opacity-50" />
      
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <span className="text-lg font-semibold gold-shimmer">Unscroll</span>
            {isDemo && (
              <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded-full">
                Demo
              </span>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {user?.displayName || 'User'}
              </span>
            </div>
            <form action={async () => { await logoutAction(); }}>
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-800/50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-red-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'decide' as Tab, label: '🎰 Decide', icon: Sparkles },
              { id: 'list' as Tab, label: '📋 Watchlist', icon: List },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'decide' ? (
          <motion.div
            key="decide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🎬</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Tonight&apos;s <span className="gold-shimmer">Feature</span>
              </h1>
              <p className="text-zinc-400 font-light max-w-md mx-auto">
                The projector is ready. Let fate choose your next cinematic experience.
              </p>
            </div>

            <SlotMachine />

            {/* Quick Add */}
            <div className="flex justify-center mt-8">
              <AddMediaForm />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Your Watchlist</h1>
                <p className="text-zinc-400 text-sm">
                  Everything you want to watch, organized
                </p>
              </div>
              <AddMediaForm />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'all' as ListFilter, label: 'All', icon: Film, color: 'text-zinc-400 hover:text-white' },
                { id: 'unwatched' as ListFilter, label: 'To Watch', icon: Film, color: 'text-red-400 hover:text-red-300' },
                { id: 'watching' as ListFilter, label: 'Watching', icon: Eye, color: 'text-yellow-400 hover:text-yellow-300' },
                { id: 'watched' as ListFilter, label: 'Watched', icon: Check, color: 'text-green-400 hover:text-green-300' },
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setListFilter(id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    listFilter === id
                      ? id === 'all'
                        ? 'bg-zinc-700 text-white'
                        : id === 'unwatched'
                        ? 'bg-red-500/20 text-red-400'
                        : id === 'watching'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                      : `bg-zinc-800/50 ${color}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <MediaList filter={listFilter} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-red-900/30 mt-auto bg-black/40">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          <p className="flex items-center justify-center gap-2">
            <span>Made with 🍿 for movie lovers</span>
            <span>•</span>
            <a
              href="https://github.com/manuelmorlin/unscroll"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >
              View Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
