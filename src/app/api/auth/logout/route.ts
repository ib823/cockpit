import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 *
 * Logout endpoint - clears authentication session
 * Supports both passkey and magic link sessions
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Clear all authentication cookies
    const authCookies = [
      'user_id',
      'user_email',
      'user_role',
      'session_token',
      'auth_session',
      'passkey_session',
      'magic_link_session',
    ];

    authCookies.forEach(cookieName => {
      cookieStore.delete(cookieName);
    });

    return NextResponse.json({
      ok: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Logout failed',
      },
      { status: 500 }
    );
  }
}
