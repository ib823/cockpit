import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { subscription, email } = await req.json();

    if (!subscription || !email) {
      return NextResponse.json(
        { ok: false, error: 'Subscription and email required' },
        { status: 400 }
      );
    }

    // Store push subscription in database
    await prisma.pushSubscription.upsert({
      where: { email },
      update: {
        subscription: JSON.stringify(subscription),
        updatedAt: new Date(),
      },
      create: {
        email,
        subscription: JSON.stringify(subscription),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
