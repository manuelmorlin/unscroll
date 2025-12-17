import { NextResponse } from 'next/server';

// Firebase REST API for password reset
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    // Send password reset email using Firebase REST API
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
      // Check specific error codes
      if (data.error.message === 'EMAIL_NOT_FOUND') {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }
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
