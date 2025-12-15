'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom hook for authentication state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseClient();

  // Check if current user is demo
  const isDemo = user?.email === process.env.NEXT_PUBLIC_DEMO_EMAIL;

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    isLoading,
    isDemo,
    signOut,
  };
}
