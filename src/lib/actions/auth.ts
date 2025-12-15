'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ==============================================
// VALIDATION SCHEMAS
// ==============================================

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = authSchema.extend({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

// ==============================================
// TYPES
// ==============================================

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

// ==============================================
// LOGIN ACTION
// ==============================================

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const validationResult = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    };
  }

  const { email, password } = validationResult.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

// ==============================================
// REGISTER ACTION
// ==============================================

export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const validationResult = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: formData.get('username'),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    };
  }

  const { email, password, username } = validationResult.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        is_demo: false,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

// ==============================================
// DEMO LOGIN ACTION
// ==============================================

export async function demoLoginAction(): Promise<AuthActionResult> {
  const supabase = await createClient();

  const demoEmail = process.env.DEMO_USER_EMAIL;
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  if (!demoEmail || !demoPassword) {
    return {
      success: false,
      error: 'Demo mode is not configured. Please contact support.',
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (error) {
    // If demo user doesn't exist, try to create it
    if (error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            username: 'Demo User',
            is_demo: true,
          },
        },
      });

      if (signUpError) {
        return {
          success: false,
          error: 'Failed to initialize demo account. Please try again.',
        };
      }

      // Try to login again
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (retryError) {
        return {
          success: false,
          error: retryError.message,
        };
      }
    } else {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

// ==============================================
// LOGOUT ACTION
// ==============================================

export async function logoutAction(): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/', 'layout');
  redirect('/auth');
}
