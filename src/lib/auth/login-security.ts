import { headers } from "next/headers";
import { SignJWT } from "jose";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  getServerSideFingerprint,
  isDeviceTrusted,
  parseUserAgent,
} from "@/lib/security/device-fingerprint";
import {
  getClientIP,
  lookupIP,
  hasLocationChanged,
  formatLocation,
  type IPGeolocation,
} from "@/lib/security/ip-geolocation";
import { sendSecurityEmail } from "@/lib/email";
import { newDeviceLoginTemplate } from "@/lib/email-templates";

/**
 * Post-login security: record the login and, when it comes from a new device
 * or a new country, email the user a security alert with a "Not Me" revoke
 * link (handled by `/api/security/revoke`).
 *
 * Salvaged from the retired password/TOTP flow so the passkey and OTP paths
 * gain the same protection. This is strictly best-effort — it never throws and
 * must never block or fail a login (all failures are swallowed and logged).
 */
export async function recordLoginAndAlert(args: {
  userId: string;
  email: string;
  method: string; // "passkey" | "otp"
}): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress = await getClientIP();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const { fingerprint } = getServerSideFingerprint(headersList);

    // Geolocation + new-country detection (best-effort — fail open).
    let geo: IPGeolocation | null = null;
    let suspicious = false;
    try {
      geo = await lookupIP(ipAddress);
      const lastLogin = await prisma.loginHistory.findFirst({
        where: { userId: args.userId, success: true },
        orderBy: { timestamp: "desc" },
        select: { country: true, city: true },
      });
      if (lastLogin?.country && lastLogin?.city && geo) {
        const change = hasLocationChanged(
          { country: lastLogin.country, city: lastLogin.city },
          geo
        );
        if (change.countryChanged) suspicious = true;
      }
    } catch (e) {
      logger.warn("[login-security] geo lookup failed", { error: e });
    }

    const isNewDevice = !(await isDeviceTrusted(args.userId, fingerprint));

    // Record the login so future logins have a comparison baseline.
    await prisma.loginHistory.create({
      data: {
        userId: args.userId,
        ipAddress,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        region: geo?.region ?? null,
        timezone: geo?.timezone ?? null,
        deviceFingerprint: fingerprint,
        userAgent,
        success: true,
        authMethod: args.method,
      },
    });

    if (!isNewDevice && !suspicious) return;

    // New device or new country → send a security alert with a Not Me link.
    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      logger.warn("[login-security] JWT_SECRET_KEY unset; skipping new-device alert");
      return;
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const notMeToken = await new SignJWT({
      userId: args.userId,
      action: "revoke_all",
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .setIssuedAt()
      .sign(secret);

    await prisma.securityAction.create({
      data: {
        userId: args.userId,
        action: "revoke_all",
        token: notMeToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        ipAddress,
        userAgent,
        metadata: {
          deviceFingerprint: fingerprint,
          location: geo ? formatLocation(geo) : "Unknown",
          method: args.method,
          newDevice: isNewDevice,
          suspicious,
        },
      },
    });

    const deviceInfo = parseUserAgent(userAgent);
    const message = newDeviceLoginTemplate({
      email: args.email,
      deviceInfo: `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`,
      location: geo ? formatLocation(geo) : "Unknown Location",
      ipAddress,
      timestamp: new Date(),
      notMeToken,
    });
    await sendSecurityEmail(args.email, message.subject, message.html);
  } catch (e) {
    logger.error("[login-security] post-login alert failed", { error: e });
  }
}
