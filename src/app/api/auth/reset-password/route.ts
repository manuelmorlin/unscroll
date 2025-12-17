import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // First, check if user exists using Admin SDK
    try {
      await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }
      throw error;
    }

    // User exists, generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // For now, we use Firebase's built-in email sending
    // The generatePasswordResetLink confirms the user exists
    // but we need to use the REST API to actually send the email
    
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.log('Password reset error:', data.error.message);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
