import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/email";
import { passwordExpiryWarningTemplate } from "@/lib/email-templates";

export const runtime = "nodejs";

/**
 * Password Expiry Warning Cron Job
 *
 * GET /api/cron/password-expiry-warnings
 *
 * Called daily to send password expiry warnings:
 * - 15 days before expiry
 * - 10 days before expiry
 * - 5 days before expiry
 * - 1 day before expiry (critical)
 *
 * Usage:
 * 1. Vercel Cron: Add to vercel.json
 * 2. External Cron: curl https://yourapp.com/api/cron/password-expiry-warnings
 * 3. Manual trigger: Visit URL with ?key=YOUR_CRON_SECRET
 */
export async function GET(req: Request) {
  const startTime = Date.now();

  try {
    // ============================================
    // 1. Verify Cron Secret (Security)
    // ============================================
    const url = new URL(req.url);
    const providedKey = url.searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET_KEY;

    // Allow execution without key in development
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret) {
        console.error("[PasswordExpiryCron] CRON_SECRET_KEY not configured");
        return NextResponse.json(
          { ok: false, message: "Cron secret not configured" },
          { status: 500 }
        );
      }

      if (providedKey !== cronSecret) {
        console.warn("[PasswordExpiryCron] Invalid cron secret provided");
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
      }
    }

    // ============================================
    // 2. Calculate Date Thresholds
    // ============================================
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of day

    // Calculate target dates (midnight of each threshold day)
    const in15Days = new Date(today);
    in15Days.setDate(today.getDate() + 15);
    const in15DaysEnd = new Date(in15Days);
    in15DaysEnd.setDate(in15Days.getDate() + 1);

    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);
    const in10DaysEnd = new Date(in10Days);
    in10DaysEnd.setDate(in10Days.getDate() + 1);

    const in5Days = new Date(today);
    in5Days.setDate(today.getDate() + 5);
    const in5DaysEnd = new Date(in5Days);
    in5DaysEnd.setDate(in5Days.getDate() + 1);

    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    const in1DayEnd = new Date(in1Day);
    in1DayEnd.setDate(in1Day.getDate() + 1);

    // ============================================
    // 3. Find Users with Expiring Passwords
    // ============================================
    const [users15Days, users10Days, users5Days, users1Day] = await Promise.all([
      // 15 days
      prisma.users.findMany({
        where: {
          passwordExpiresAt: {
            gte: in15Days,
            lt: in15DaysEnd,
          },
          accountLockedAt: null, // Don't email locked accounts
        },
        select: {
          id: true,
          email: true,
          passwordExpiresAt: true,
        },
      }),
      // 10 days
      prisma.users.findMany({
        where: {
          passwordExpiresAt: {
            gte: in10Days,
            lt: in10DaysEnd,
          },
          accountLockedAt: null,
        },
        select: {
          id: true,
          email: true,
          passwordExpiresAt: true,
        },
      }),
      // 5 days
      prisma.users.findMany({
        where: {
          passwordExpiresAt: {
            gte: in5Days,
            lt: in5DaysEnd,
          },
          accountLockedAt: null,
        },
        select: {
          id: true,
          email: true,
          passwordExpiresAt: true,
        },
      }),
      // 1 day (critical)
      prisma.users.findMany({
        where: {
          passwordExpiresAt: {
            gte: in1Day,
            lt: in1DayEnd,
          },
          accountLockedAt: null,
        },
        select: {
          id: true,
          email: true,
          passwordExpiresAt: true,
        },
      }),
    ]);

    // ============================================
    // 4. Send Warning Emails
    // ============================================
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Helper function to send warnings
    const sendWarnings = async (users: { id: string; email: string; passwordExpiresAt: Date | null }[], daysRemaining: number) => {
      for (const user of users) {
        // Skip users without password expiry date
        if (!user.passwordExpiresAt) continue;

        try {
          const emailContent = passwordExpiryWarningTemplate({
            email: user.email,
            daysRemaining,
            expiryDate: user.passwordExpiresAt,
          });

          await sendSecurityEmail(user.email, emailContent.subject, emailContent.html);

          // Log email sent
          await prisma.emailLog.create({
            data: {
              to: user.email,
              subject: emailContent.subject,
              template: "password_expiry_warning",
              status: "sent",
              provider: "system",
              metadata: {
                daysRemaining,
                expiryDate: user.passwordExpiresAt,
              },
              sentAt: new Date(),
            },
          });

          results.sent++;
        } catch (emailError: unknown) {
          console.error(`[PasswordExpiryCron] Failed to send email to ${user.email}:`, emailError);
          results.failed++;
          const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
          results.errors.push(`${user.email}: ${errorMessage}`);

          // Log failed email
          await prisma.emailLog.create({
            data: {
              to: user.email,
              subject: `Password Expiry Warning (${daysRemaining} days)`,
              template: "password_expiry_warning",
              status: "failed",
              provider: "system",
              error: errorMessage,
              metadata: {
                daysRemaining,
                expiryDate: user.passwordExpiresAt,
              },
              failedAt: new Date(),
            },
          });
        }
      }
    };

    // Send warnings for each threshold
    await sendWarnings(users15Days, 15);
    await sendWarnings(users10Days, 10);
    await sendWarnings(users5Days, 5);
    await sendWarnings(users1Day, 1);

    // ============================================
    // 5. Force Expire Passwords (Day 0)
    // ============================================
    const expiredUsers = await prisma.users.findMany({
      where: {
        passwordExpiresAt: {
          lt: today,
        },
        accountLockedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Don't lock accounts yet, just force password change on next login
    // The login API will handle this check

    // ============================================
    // 6. Return Summary
    // ============================================
    const duration = Date.now() - startTime;

    const summary = {
      ok: true,
      message: "Password expiry warnings sent successfully",
      stats: {
        warnings15Days: users15Days.length,
        warnings10Days: users10Days.length,
        warnings5Days: users5Days.length,
        warnings1Day: users1Day.length,
        expiredPasswords: expiredUsers.length,
        totalEmailsSent: results.sent,
        totalEmailsFailed: results.failed,
      },
      execution: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    };

    // Log execution summary for monitoring
    console.warn("[PasswordExpiryCron] Execution summary:", summary);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error("[PasswordExpiryCron] Cron job failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Cron job failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
