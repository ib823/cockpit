import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { verifyTOTPCode, decryptTOTPSecret } from "@/lib/security/totp";
import {
  
  getServerSideFingerprint,
  isDeviceTrusted,
  trustDevice,
  parseUserAgent,
} from "@/lib/security/device-fingerprint";
import {
  getClientIP,
  lookupIP,
  hasLocationChanged,
  formatLocation,
  IPGeolocation,
} from "@/lib/security/ip-geolocation";
import { sendSecurityEmail } from "@/lib/email";
import { newDeviceLoginTemplate } from "@/lib/email-templates";
import { SignJWT } from "jose";

export const runtime = "nodejs";

/**
 * Secure Login Endpoint
 *
 * POST /api/auth/login-secure
 *
 * Features:
 * - Password + TOTP verification
 * - Rate limiting & account lockout
 * - Device fingerprinting
 * - IP geolocation & suspicious travel detection
 * - Login history tracking
 * - Concurrent session enforcement
 * - Password expiry check
 * - Account lock check
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = body.password;
    const totpCode = body.totpCode;
    const clientFingerprint = body.fingerprint; // From client-side FingerprintJS
    const rememberDevice = body.rememberDevice === true;

    // ============================================
    // 1. Get Client Information
    // ============================================
    const headersList = await headers();
    const ipAddress = await getClientIP();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const serverFingerprint = await getServerSideFingerprint(headersList);
    const deviceFingerprint = clientFingerprint || serverFingerprint;

    // ============================================
    // 2. Validate Input
    // ============================================
    if (!email || !password || !totpCode) {
      return NextResponse.json(
        { ok: false, message: "Email, password, and TOTP code are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, message: "Invalid email format." }, { status: 400 });
    }

    if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
      return NextResponse.json(
        { ok: false, message: "TOTP code must be 6 digits." },
        { status: 400 }
      );
    }

    // ============================================
    // 3. Find User
    // ============================================
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        loginHistory: {
          where: { success: true },
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      // Don't reveal whether user exists
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Timing attack mitigation
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ============================================
    // 4. Check Account Lock
    // ============================================
    if (user.accountLockedAt) {
      // Check if it's a temporary lock (15 min or 1 hour)
      const lockDuration = Date.now() - user.accountLockedAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      const oneHour = 60 * 60 * 1000;

      let lockExpired = false;
      if (user.failedLoginAttempts <= 10) {
        // 5-10 failures = 15 min lock
        lockExpired = lockDuration > fifteenMinutes;
      } else if (user.failedLoginAttempts <= 20) {
        // 10-20 failures = 1 hour lock
        lockExpired = lockDuration > oneHour;
      }
      // 20+ failures = permanent lock (admin unlock required)

      if (!lockExpired) {
        const remainingTime =
          user.failedLoginAttempts <= 10
            ? Math.ceil((fifteenMinutes - lockDuration) / 60000)
            : Math.ceil((oneHour - lockDuration) / 60000);

        return NextResponse.json(
          {
            ok: false,
            message:
              user.failedLoginAttempts >= 20
                ? "Account locked. Please contact support."
                : `Account temporarily locked. Try again in ${remainingTime} minute(s).`,
            locked: true,
            accountLockedReason: user.accountLockedReason,
          },
          { status: 423 }
        );
      } else {
        // Lock expired, auto-unlock
        await prisma.users.update({
          where: { id: user.id },
          data: {
            accountLockedAt: null,
            accountLockedReason: null,
            failedLoginAttempts: 0,
          },
        });
      }
    }

    // ============================================
    // 5. Verify Password
    // ============================================
    if (!user.passwordHash) {
      return NextResponse.json(
        { ok: false, message: "Please complete your account setup first." },
        { status: 400 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const lockData: {
        failedLoginAttempts: number;
        accountLockedAt?: Date;
        accountLockedReason?: string;
      } = { failedLoginAttempts: newFailedAttempts };

      // Apply lockout rules
      if (newFailedAttempts === 5) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "5 failed login attempts - 15 minute lockout";
      } else if (newFailedAttempts === 10) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "10 failed login attempts - 1 hour lockout";
      } else if (newFailedAttempts >= 20) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "20+ failed login attempts - admin unlock required";
      }

      await prisma.$transaction([
        prisma.users.update({
          where: { id: user.id },
          data: lockData,
        }),
        prisma.loginHistory.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            ipAddress,
            deviceFingerprint,
            userAgent,
            success: false,
            failureReason: "invalid_password",
            authMethod: "password_totp",
            timestamp: new Date(),
          },
        }),
      ]);

      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ============================================
    // 6. Check Password Expiry
    // ============================================
    if (user.passwordExpiresAt && user.passwordExpiresAt < new Date()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Your password has expired. Please reset your password.",
          passwordExpired: true,
          requirePasswordReset: true,
        },
        { status: 403 }
      );
    }

    // ============================================
    // 7. Verify TOTP Code
    // ============================================
    if (!user.totpSecret) {
      return NextResponse.json(
        { ok: false, message: "TOTP not set up. Please complete registration." },
        { status: 400 }
      );
    }

    const decryptedSecret = decryptTOTPSecret(user.totpSecret);
    const totpValid = verifyTOTPCode(totpCode, decryptedSecret);

    if (!totpValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const lockData: {
        failedLoginAttempts: number;
        lastFailedLoginAt: Date;
        accountLockedAt?: Date;
        accountLockedReason?: string;
      } = {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: new Date(),
      };

      if (newFailedAttempts === 5) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "5 failed TOTP attempts - 15 minute lockout";
      } else if (newFailedAttempts === 10) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "10 failed TOTP attempts - 1 hour lockout";
      } else if (newFailedAttempts >= 20) {
        lockData.accountLockedAt = new Date();
        lockData.accountLockedReason = "20+ failed TOTP attempts - admin unlock required";
      }

      await prisma.$transaction([
        prisma.users.update({
          where: { id: user.id },
          data: lockData,
        }),
        prisma.loginHistory.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            ipAddress,
            deviceFingerprint,
            userAgent,
            success: false,
            failureReason: "invalid_totp",
            authMethod: "password_totp",
            timestamp: new Date(),
          },
        }),
      ]);

      return NextResponse.json({ ok: false, message: "Invalid TOTP code." }, { status: 401 });
    }

    // ============================================
    // 8. Get IP Geolocation (with fallback)
    // ============================================
    let geoData: IPGeolocation | null = null;
    let isNewLocation = false;
    let isSuspiciousLogin = false;

    try {
      geoData = await lookupIP(ipAddress);

      // Check if location has changed
      if (user.loginHistory.length > 0) {
        const lastLogin = user.loginHistory[0];
        if (lastLogin.country && lastLogin.city) {
          const prevLocation = {
            country: lastLogin.country,
            city: lastLogin.city,
            latitude: 0, // We don't store coordinates, so travel detection is limited
            longitude: 0,
          };

          const locationChange = hasLocationChanged(prevLocation, geoData);
          isNewLocation = locationChange.significant;

          // Note: Suspicious travel detection requires coordinates from last login
          // For now, we'll just flag new countries
          if (locationChange.countryChanged) {
            isSuspiciousLogin = true;
          }
        }
      }
    } catch (geoError) {
      console.error("[Login] IP geolocation failed:", geoError);
      // Fail open - don't block login
    }

    // ============================================
    // 9. Check Device Trust
    // ============================================
    const deviceTrusted = await isDeviceTrusted(user.id, deviceFingerprint);
    const isNewDevice = !deviceTrusted;

    // ============================================
    // 10. Concurrent Session Enforcement
    // ============================================
    const activeSessions = await prisma.sessions.findMany({
      where: {
        userId: user.id,
        expires: { gt: new Date() },
        revokedAt: null,
      },
      orderBy: { lastActivity: "desc" },
    });

    const maxSessions = user.maxConcurrentSessions || 1;

    // Revoke oldest sessions if limit exceeded
    if (activeSessions.length >= maxSessions) {
      const sessionsToRevoke = activeSessions.slice(maxSessions - 1);

      await prisma.sessions.updateMany({
        where: {
          id: { in: sessionsToRevoke.map((s) => s.id) },
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "concurrent_limit",
        },
      });

      // TODO: Send email notification about kicked sessions
    }

    // ============================================
    // 11. Create Session
    // ============================================
    const sessionToken = randomUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.sessions.create({
      data: {
        id: randomUUID(),
        sessionToken,
        userId: user.id,
        expires: sessionExpiry,
        deviceFingerprint,
        userAgent,
        ipAddress,
        country: geoData?.country || null,
        city: geoData?.city || null,
        lastActivity: new Date(),
        createdAt: new Date(),
      },
    });

    // ============================================
    // 12. Trust Device (if requested)
    // ============================================
    if (rememberDevice && isNewDevice) {
      const deviceInfo = parseUserAgent(userAgent);
      const nickname = `${deviceInfo.browser} on ${deviceInfo.os}`;

      await trustDevice(user.id, deviceFingerprint, {
        userAgent,
        ipAddress,
        nickname,
        country: geoData?.country ?? undefined,
        city: geoData?.city ?? undefined,
      });
    }

    // ============================================
    // 13. Log Successful Login
    // ============================================
    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0, // Reset on successful login
          lastFailedLoginAt: null,
        },
      }),
      prisma.loginHistory.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          ipAddress,
          country: geoData?.country || null,
          city: geoData?.city || null,
          region: geoData?.region || null,
          timezone: geoData?.timezone || null,
          deviceId: null, // TODO: Link to TrustedDevice if exists
          deviceFingerprint,
          userAgent,
          success: true,
          authMethod: "password_totp",
          timestamp: new Date(),
        },
      }),
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: "LOGIN_SUCCESS",
          createdAt: new Date(),
          meta: {
            ipAddress,
            location: geoData ? formatLocation(geoData) : "Unknown",
            deviceFingerprint,
            newDevice: isNewDevice,
            newLocation: isNewLocation,
            suspicious: isSuspiciousLogin,
            authMethod: "password_totp",
          },
        },
      }),
    ]);

    // ============================================
    // 14. Send Security Alert (New Device/Location)
    // ============================================
    if (isNewDevice || isSuspiciousLogin) {
      try {
        // Generate "Not Me" token
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET_KEY || "default-secret-change-in-production"
        );
        const notMeToken = await new SignJWT({
          userId: user.id,
          action: "revoke_all",
          loginId: session.id,
          timestamp: Date.now(),
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("5m")
          .setIssuedAt()
          .sign(secret);

        // Save security action
        await prisma.securityAction.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            action: "revoke_all",
            token: notMeToken,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            ipAddress,
            userAgent,
            metadata: {
              loginId: session.id,
              deviceFingerprint,
              location: geoData ? formatLocation(geoData) : "Unknown",
            },
          },
        });

        const deviceInfo = parseUserAgent(userAgent);
        const emailContent = newDeviceLoginTemplate({
          email: user.email,
          deviceInfo: `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`,
          location: geoData ? formatLocation(geoData) : "Unknown Location",
          ipAddress,
          timestamp: new Date(),
          notMeToken,
        });

        await sendSecurityEmail(user.email, emailContent.subject, emailContent.html);
      } catch (emailError) {
        console.error("[Login] Failed to send security alert:", emailError);
        // Don't fail login if email fails
      }
    }

    // ============================================
    // 15. Return Success
    // ============================================
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      message: "Login successful",
      session: {
        sessionToken,
        expires: sessionExpiry,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      security: {
        newDevice: isNewDevice,
        newLocation: isNewLocation,
        suspicious: isSuspiciousLogin,
        passwordExpiresIn: user.passwordExpiresAt
          ? Math.ceil((user.passwordExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    console.error("[Login] Error:", error);
    return NextResponse.json(
      { ok: false, message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
