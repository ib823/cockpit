/**
 * Backup Recovery Codes System
 *
 * Generates and manages single-use backup codes for account recovery:
 * - 10 alphanumeric codes (8 characters each)
 * - Bcrypt hashed before storage
 * - Can be used when TOTP device is lost
 * - Each code can only be used once
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const BCRYPT_COST = 12;

export interface BackupCode {
  code: string;
  hash: string;
}

export interface BackupCodesPackage {
  codes: string[];          // Plain text codes (show to user ONCE)
  hashes: string[];         // Bcrypt hashes (store in database)
  downloadContent: string;  // .txt file content for download
}

/**
 * Generate a set of backup codes
 */
export async function generateBackupCodes(): Promise<BackupCodesPackage> {
  const codes: BackupCode[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = generateSingleCode();
    const hash = await bcrypt.hash(code, BCRYPT_COST);
    codes.push({ code, hash });
  }

  const downloadContent = createDownloadFile(codes.map(c => c.code));

  return {
    codes: codes.map(c => c.code),
    hashes: codes.map(c => c.hash),
    downloadContent
  };
}

/**
 * Generate a single backup code
 * Format: XXXX-XXXX (8 characters, hyphen in middle for readability)
 */
function generateSingleCode(): string {
  // Use alphanumeric without confusing characters (no 0, O, 1, I, l)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    code += charset[randomIndex];

    // Add hyphen in the middle for readability
    if (i === BACKUP_CODE_LENGTH / 2 - 1) {
      code += '-';
    }
  }

  return code;
}

/**
 * Create downloadable .txt file content
 */
function createDownloadFile(codes: string[]): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Cockpit';
  const date = new Date().toISOString().split('T')[0];

  return `${appName} - Backup Recovery Codes
Generated: ${date}

IMPORTANT:
- Save these codes in a secure location
- Each code can only be used once
- You'll need these if you lose access to your authenticator app
- Keep these codes private and secure

Your Backup Codes:
==================
${codes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

==================

If you lose these codes, you can generate new ones from your account settings.
Generating new codes will invalidate all previous codes.

© ${new Date().getFullYear()} ${appName}
`;
}

/**
 * Save backup codes to database for a user
 */
export async function saveBackupCodes(userId: string, hashes: string[]): Promise<void> {
  // Delete old backup codes
  await prisma.recoveryCode.deleteMany({
    where: { userId }
  });

  // Insert new codes
  await prisma.recoveryCode.createMany({
    data: hashes.map(hash => ({
      id: crypto.randomUUID(),
      userId,
      codeHash: hash,
      createdAt: new Date()
    }))
  });
}

/**
 * Verify a backup code and mark it as used
 */
export async function verifyAndUseBackupCode(
  userId: string,
  code: string,
  ipAddress: string
): Promise<{ valid: boolean; remaining: number }> {
  // Remove hyphen and whitespace
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();

  // Get all unused codes for user
  const userCodes = await prisma.recoveryCode.findMany({
    where: {
      userId,
      usedAt: null
    }
  });

  // Try to match the code
  for (const dbCode of userCodes) {
    const matches = await bcrypt.compare(cleanCode, dbCode.codeHash);

    if (matches) {
      // Mark as used
      await prisma.recoveryCode.update({
        where: { id: dbCode.id },
        data: {
          usedAt: new Date(),
          usedFrom: ipAddress
        }
      });

      // Count remaining codes
      const remaining = userCodes.length - 1;

      return { valid: true, remaining };
    }
  }

  return { valid: false, remaining: userCodes.length };
}

/**
 * Get count of remaining (unused) backup codes for a user
 */
export async function getRemainingBackupCodeCount(userId: string): Promise<number> {
  return prisma.recoveryCode.count({
    where: {
      userId,
      usedAt: null
    }
  });
}

/**
 * Check if user has backup codes set up
 */
export async function hasBackupCodes(userId: string): Promise<boolean> {
  const count = await prisma.recoveryCode.count({
    where: { userId }
  });
  return count > 0;
}

/**
 * Regenerate backup codes (invalidates all old codes)
 */
export async function regenerateBackupCodes(userId: string): Promise<BackupCodesPackage> {
  const newCodes = await generateBackupCodes();
  await saveBackupCodes(userId, newCodes.hashes);
  return newCodes;
}

/**
 * Format backup code for display (add hyphen if missing)
 */
export function formatBackupCode(code: string): string {
  const clean = code.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length === BACKUP_CODE_LENGTH) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

/**
 * Validate backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  const clean = code.replace(/[-\s]/g, '').toUpperCase();
  const validCharset = /^[A-Z2-9]+$/;
  return clean.length === BACKUP_CODE_LENGTH && validCharset.test(clean);
}
