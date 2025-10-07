import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 * SECURITY: Proper logout with server-side session revocation
 * Supports both passkey and magic link sessions
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use proper logout with Redis session revocation
    await logout();

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
