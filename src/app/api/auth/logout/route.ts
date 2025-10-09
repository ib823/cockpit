import { NextRequest, NextResponse } from 'next/server';
import { destroyAuthSession } from '@/lib/nextauth-helpers';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 * SECURITY: Proper logout with server-side session revocation
 * Supports both passkey and magic link sessions
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Destroy NextAuth session
    await destroyAuthSession();

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
