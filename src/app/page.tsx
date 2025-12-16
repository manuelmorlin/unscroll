import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Sparkles, Film, Shuffle, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">Unscroll</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/auth?mode=login"
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?mode=register"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-full hover:from-amber-400 hover:to-orange-400 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Stop scrolling. Start watching.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Let <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">fate</span> decide
            <br />what you watch
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tired of spending more time choosing than watching? 
            Add your movies, spin the wheel, and let Unscroll pick your next film.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth?mode=register"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-full hover:from-amber-400 hover:to-orange-400 transition-all text-lg"
            >
              <span>Start for Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/auth?mode=login"
              className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-full transition-all text-lg"
            >
              <span>Try Demo</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Slot Machine Animation Preview */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl border border-zinc-800 p-8 md:p-12 overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Mock Slot Machine */}
              <div className="flex justify-center gap-4 mb-8">
                {['🎬', '🍿', '🎭'].map((emoji, i) => (
                  <div 
                    key={i}
                    className="w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-2xl flex items-center justify-center text-4xl md:text-5xl border border-zinc-700 shadow-xl"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              
              {/* Mock Result */}
              <div className="text-center">
                <p className="text-zinc-500 text-sm mb-2">Tonight&apos;s pick:</p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Inception</h3>
                <p className="text-amber-400 italic">&ldquo;Trust me, you&apos;ll forget to breathe during the last 20 minutes.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-zinc-400 text-lg">Three simple steps to movie night bliss</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                <Film className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Build your list</h3>
              <p className="text-zinc-400 leading-relaxed">
                Add movies you want to watch. Our AI auto-fills all the details for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                <Shuffle className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Spin the wheel</h3>
              <p className="text-zinc-400 leading-relaxed">
                Can&apos;t decide? Let fate choose. Hit spin and watch the magic happen.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Start watching</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get a persuasive pitch that&apos;ll make you excited to press play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">∞</div>
              <div className="text-zinc-400 text-sm">Hours saved from scrolling</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">100%</div>
              <div className="text-zinc-400 text-sm">Decision fatigue eliminated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">
                <Clock className="w-8 h-8 md:w-10 md:h-10 mx-auto" />
              </div>
              <div className="text-zinc-400 text-sm">More time actually watching</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to stop scrolling?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join now and let fate decide your next movie night.
          </p>
          <Link 
            href="/auth?mode=register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-full hover:from-amber-400 hover:to-orange-400 transition-all text-lg"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold">Unscroll</span>
          </div>
          <p className="text-zinc-500 text-sm">
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
