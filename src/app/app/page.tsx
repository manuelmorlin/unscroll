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
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-semibold text-white">Unscroll</span>
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
              <span className="hidden sm:inline">{user?.displayName || user?.email}</span>
            </div>
            <form action={async () => { await logoutAction(); }}>
              <button
                type="submit"
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'decide' as Tab, label: 'Decide', icon: Sparkles },
              { id: 'list' as Tab, label: 'Watchlist', icon: List },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                What should I watch?
              </h1>
              <p className="text-zinc-400 font-light max-w-md mx-auto">
                Stop scrolling through endless options. Let us pick something from your
                watchlist.
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
      <footer className="border-t border-zinc-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          <p>
            Built with Next.js, Firebase & OpenAI •{' '}
            <a
              href="https://github.com/manuelmorlin/unscroll"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline"
            >
              View Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
