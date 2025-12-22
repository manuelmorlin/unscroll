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

    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    // Check if user exists, but don't reveal the result to the client
    let userExists = false;
    try {
      await adminAuth.getUserByEmail(email);
      userExists = true;
    } catch {
      // User doesn't exist - we'll still return success to prevent account enumeration
      userExists = false;
    }

    // Only send email if user exists, but always return success
    if (userExists) {
      try {
        await fetch(
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
      } catch (err) {
        console.error('Failed to send reset email:', err);
        // Still return success to prevent account enumeration
      }
    }

    // Always return the same generic message
    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
