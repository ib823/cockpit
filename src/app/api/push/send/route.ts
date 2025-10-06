import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export const runtime = 'nodejs';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@cockpit.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { email, code, magicToken } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email required' },
        { status: 400 }
      );
    }

    // Get push subscription for this email
    const pushSub = await prisma.pushSubscription.findUnique({
      where: { email },
    });

    if (!pushSub || !pushSub.subscription) {
      return NextResponse.json(
        { ok: false, error: 'No push subscription found' },
        { status: 404 }
      );
    }

    const subscription = JSON.parse(pushSub.subscription as string);

    // Build magic link if token provided
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicUrl = magicToken ? `${baseUrl}/login?token=${magicToken}` : null;

    // Send push notification with magic link or code
    const payload = JSON.stringify({
      title: '🔐 Cockpit Access Ready',
      body: magicUrl
        ? '✓ Click to login securely (expires in 5 min)'
        : `Your access code: ${code}`,
      url: magicUrl || `${baseUrl}/login`,
      code: !magicUrl ? code : undefined,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: magicUrl || `${baseUrl}/login`,
        requireInteraction: true,
        // Trust indicators
        approvedDomain: new URL(baseUrl).hostname,
        expiresIn: '5 minutes',
        isSecure: true,
      },
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ ok: true, message: 'Push notification sent' });
  } catch (error: any) {
    console.error('Push send error:', error);

    if (error.message === 'forbidden') {
      return NextResponse.json(
        { ok: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
