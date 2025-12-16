import { AuthForm } from '@/components/auth';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === 'register' ? 'register' : 'login';

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <AuthForm initialMode={initialMode} />
    </main>
  );
}
