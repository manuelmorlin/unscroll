'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DemoButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function DemoButton({ className, children }: DemoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle demo login via server API (password never exposed to client)
  const handleDemoLogin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Demo login failed');
      }

      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      console.error('Demo login error:', err);
      // Redirect to auth page on error
      router.push('/auth?mode=login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDemoLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children || <span>🎬 Watch Demo</span>
      )}
    </button>
  );
}
