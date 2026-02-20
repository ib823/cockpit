/**
 * TOTP (Time-based One-Time Password) Utilities
 *
 * Implements Google Authenticator-compatible TOTP:
 * - Generate secret keys
 * - Create QR codes for easy enrollment
 * - Verify 6-digit codes with time window tolerance
 * - Compatible with Google Authenticator, Authy, 1Password, etc.
 */

import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Bound";
const TOTP_WINDOW = 2; // Allow 2 time steps before/after (60 second window)

export interface TOTPSecret {
  secret: string; // Base32 encoded secret
  qrCode: string; // Data URL for QR code image
  manualEntry: string; // Secret in human-readable format
}

export interface TOTPVerifyResult {
  valid: boolean;
  delta?: number; // Time step delta (0 = exact, -1/+1 = within window)
}

/**
 * Generate a new TOTP secret for a user
 */
export async function generateTOTPSecret(email: string): Promise<TOTPSecret> {
  // Generate a random secret (32 characters base32 = 160 bits)
  const secret = speakeasy.generateSecret({
    length: 32,
    name: `${APP_NAME} (${email})`,
    issuer: APP_NAME,
  });

  // Generate QR code as data URL
  const otpAuthUrl = secret.otpauth_url;
  if (!otpAuthUrl) {
    throw new Error("Failed to generate OTP auth URL");
  }

  const qrCode = await QRCode.toDataURL(otpAuthUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: "#0f172a", // Slate 900
      light: "#ffffff",
    },
  });

  return {
    secret: secret.base32,
    qrCode,
    manualEntry: formatSecretForDisplay(secret.base32),
  };
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTPCode(code: string, secret: string): TOTPVerifyResult {
  // Remove any whitespace from code
  const cleanCode = code.replace(/\s/g, "");

  // Verify the code
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: cleanCode,
    window: TOTP_WINDOW,
  });

  if (typeof verified === "boolean") {
    return { valid: verified };
  }

  // speakeasy returns delta if verification succeeds
  return {
    valid: true,
    delta: verified,
  };
}

/**
 * Generate current TOTP code (for testing/debugging only!)
 * WARNING: Never use this in production for actual authentication
 */
export function generateTOTPCode(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: "base32",
  });
}

/**
 * Encrypt TOTP secret before storing in database
 */
export function encryptTOTPSecret(secret: string): string {
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes)");
  }

  const key = Buffer.from(encryptionKey, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt TOTP secret from database
 */
export function decryptTOTPSecret(encryptedSecret: string): string {
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes)");
  }

  const key = Buffer.from(encryptionKey, "hex");
  const [ivHex, encrypted] = encryptedSecret.split(":");

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted TOTP secret format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Format secret for manual entry (groups of 4 characters)
 * Example: JBSW Y3DP EHPK 3PXP
 */
function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}

/**
 * Validate TOTP secret format
 */
export function isValidTOTPSecret(secret: string): boolean {
  // Base32 alphabet: A-Z, 2-7
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(secret);
}

/**
 * Get remaining time until current TOTP code expires (in seconds)
 */
export function getTOTPTimeRemaining(): number {
  const timeStep = 30; // TOTP time step in seconds
  const currentTime = Math.floor(Date.now() / 1000);
  return timeStep - (currentTime % timeStep);
}

/**
 * Generate backup TOTP secret encryption key
 * Run this once and store in environment variable
 */
export function generateTOTPEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
