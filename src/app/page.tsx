import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DemoButton } from '@/components/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen cinema-bg text-white overflow-hidden">

      {/* Animated Stars Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full star"
            style={{
              left: `${5 + (i * 5) % 90}%`,
              top: `${10 + (i * 7) % 80}%`,
              animationDelay: `${(i * 0.1) % 2}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Curtain Effects */}
      <div className="fixed left-0 top-0 bottom-0 w-32 curtain-left pointer-events-none" />
      <div className="fixed right-0 top-0 bottom-0 w-32 curtain-right pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-lg border-b border-red-900/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <span className="text-lg sm:text-xl">🎬</span>
            </div>
            <span className="text-lg sm:text-xl font-bold gold-shimmer">Unscroll</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/auth?mode=login"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-zinc-400 hover:text-yellow-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?mode=register"
              className="px-3 sm:px-5 py-2 text-sm sm:text-base bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-500 transition-all shadow-lg shadow-red-900/50 border border-red-500/30"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        {/* Spotlight Effect */}
        <div className="absolute inset-0 spotlight pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/40 rounded-full text-red-300 text-sm mb-8">
            <span className="text-lg">🍿</span>
            <span>Your personal film diary & decision maker</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Let <span className="gold-shimmer">fate</span> decide
            <br />what you watch <span className="text-4xl md:text-6xl">🎭</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track every film you watch, rate your favorites, and never spend hours deciding again. 
            Your personal watchlist meets AI-powered recommendations and a slot machine that picks for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth?mode=register"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-500 transition-all text-lg shadow-xl shadow-red-900/50 border border-red-500/30"
            >
              <span>🎟️ Get Your Ticket</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <DemoButton 
              className="flex items-center gap-2 px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 text-white font-medium rounded-full transition-all text-lg border border-zinc-700 disabled:opacity-50"
            >
              <span>🎬 Watch Demo</span>
            </DemoButton>
          </div>

        </div>
      </section>

      {/* Cinema Screen Preview */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Screen Frame */}
          <div className="relative">
            {/* Top Frame Bar */}
            <div className="h-4 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-xl border-t border-l border-r border-zinc-700" />
            
            {/* Screen */}
            <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-l border-r border-zinc-700 p-8 md:p-12 overflow-hidden">
              {/* Projector Light Effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-gradient-to-b from-yellow-500/5 to-transparent projector-light" />
              </div>
              
              {/* Glow Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                {/* Mock Slot Machine Reels */}
                <div className="flex justify-center gap-4 mb-8">
                  {['🎬', '🍿', '🎭'].map((emoji, i) => (
                    <div 
                      key={i}
                      className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center text-4xl md:text-5xl border border-zinc-700 shadow-2xl shadow-black/50"
                      style={{
                        boxShadow: '0 0 30px rgba(139, 0, 0, 0.2), inset 0 2px 4px rgba(255,255,255,0.1)'
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                
                {/* Mock Result */}
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-2 flex items-center justify-center gap-2">
                    <span className="inline-block w-8 h-px bg-zinc-700" />
                    Tonight&apos;s Feature Presentation
                    <span className="inline-block w-8 h-px bg-zinc-700" />
                  </p>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">✨ Inception ✨</h3>
                  <p className="text-yellow-400 italic text-lg">&ldquo;Trust me, you&apos;ll forget to breathe during the last 20 minutes.&rdquo;</p>
                </div>
              </div>
            </div>
            
            {/* Bottom Frame Bar */}
            <div className="h-4 bg-gradient-to-t from-zinc-800 to-zinc-900 rounded-b-xl border-b border-l border-r border-zinc-700" />
          </div>
          
          {/* Speaker Dots */}
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gold-shimmer">Everything you need</span> 🎥
            </h2>
            <p className="text-zinc-400 text-lg">A complete toolkit for film lovers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                �
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Watchlist</h3>
              <p className="text-zinc-400 leading-relaxed">
                Add films you want to watch. Our AI auto-fills genres, cast, plot, and more from TMDB.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                🎰
              </div>
              <h3 className="text-xl font-semibold mb-3">Decision Slot Machine</h3>
              <p className="text-zinc-400 leading-relaxed">
                Can&apos;t decide? Filter by genre and spin. Let fate pick your next movie night.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                📖
              </div>
              <h3 className="text-xl font-semibold mb-3">Personal Film Diary</h3>
              <p className="text-zinc-400 leading-relaxed">
                Rate every film with stars, write reviews, and keep track of everything you&apos;ve watched.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                ✨
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Insights</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get personalized recommendations, automatic reviews, and deep analysis of your taste.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                🎁
              </div>
              <h3 className="text-xl font-semibold mb-3">Year Wrapped</h3>
              <p className="text-zinc-400 leading-relaxed">
                Discover your yearly film stats, favorite genres, and personalized insights about your viewing habits.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-red-900/30 rounded-2xl p-8 hover:border-red-700/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                🎬
              </div>
              <h3 className="text-xl font-semibold mb-3">Rich Film Details</h3>
              <p className="text-zinc-400 leading-relaxed">
                Complete info from TMDB: posters, cast, runtime, genres, and plot summaries for every film.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-red-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">∞</div>
              <div className="text-zinc-400 text-sm">Hours saved from scrolling</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">100%</div>
              <div className="text-zinc-400 text-sm">Decision fatigue eliminated</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl mb-2">🍿</div>
              <div className="text-zinc-400 text-sm">More time actually watching</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 spotlight pointer-events-none" style={{ '--y': '70%' } as React.CSSProperties} />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="text-5xl mb-6">🎟️</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to enter the <span className="gold-shimmer">cinema</span>?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join now and let fate decide your next movie night.
          </p>
          <Link 
            href="/auth?mode=register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-500 transition-all text-lg shadow-xl shadow-red-900/50 border border-red-500/30"
          >
            <span>🎬 Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-red-900/30 py-8 px-4 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <span className="font-semibold gold-shimmer">Unscroll</span>
          </div>
          <p className="text-zinc-500 text-sm whitespace-nowrap">
            Made with 🍿 for movie lovers · <a
              href="https://github.com/manuelmorlin/unscroll"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >View Source</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
