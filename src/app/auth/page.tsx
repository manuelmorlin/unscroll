import { AuthForm } from '@/components/auth';
import { getPopularMoviePosters } from '@/lib/actions/tmdb';
import { LandingPosters } from '@/components/ui';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === 'register' ? 'register' : 'login';

  // Fetch popular movie posters for background
  const postersResult = await getPopularMoviePosters();
  const posters = postersResult.success ? postersResult.posters || [] : [];

  return (
    <main className="h-screen sm:min-h-screen cinema-bg flex items-center justify-center px-4 py-2 sm:py-12 relative overflow-hidden overflow-y-hidden">
      {/* Floating Movie Posters Background */}
      <LandingPosters initialPosters={posters} />

      {/* Animated Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full star"
            style={{
              left: `${5 + (i * 7) % 90}%`,
              top: `${10 + (i * 11) % 80}%`,
              animationDelay: `${(i * 0.15) % 2}s`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>
      
      {/* Curtain Effects */}
      <div className="fixed left-0 top-0 bottom-0 w-24 curtain-left pointer-events-none" />
      <div className="fixed right-0 top-0 bottom-0 w-24 curtain-right pointer-events-none" />
      
      {/* Spotlight */}
      <div className="absolute inset-0 spotlight pointer-events-none" />
      
      <AuthForm initialMode={initialMode} />
    </main>
  );
}
