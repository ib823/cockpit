#!/usr/bin/env tsx
/**
 * Secret Rotation Script
 *
 * Automates the process of rotating sensitive secrets on a 90-day cycle.
 * Should be run manually or via scheduled CI/CD pipeline.
 *
 * Usage:
 *   npx tsx scripts/rotate-secrets.ts --check    # Check rotation status
 *   npx tsx scripts/rotate-secrets.ts --rotate   # Perform rotation
 *   npx tsx scripts/rotate-secrets.ts --force    # Force rotation regardless of schedule
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

interface RotationRecord {
  secretName: string;
  lastRotated: string; // ISO date
  nextRotation: string; // ISO date
  rotationInterval: number; // days
}

interface RotationStatus {
  upToDate: RotationRecord[];
  needsRotation: RotationRecord[];
  overdue: RotationRecord[];
}

const ROTATION_FILE = path.join(__dirname, "../.secret-rotation.json");
const ROTATION_INTERVAL_DAYS = 90;

// Secrets that should be rotated regularly
const ROTATABLE_SECRETS = [
  "NEXTAUTH_SECRET",
  "ADMIN_PASSWORD_HASH",
  "VAPID_PRIVATE_KEY",
  "UPSTASH_REDIS_REST_TOKEN", // Note: Requires Upstash console update
];

/**
 * Generate a new secure secret
 */
function generateSecret(type: string): string {
  switch (type) {
    case "NEXTAUTH_SECRET":
      // 32-byte random string, base64 encoded
      return crypto.randomBytes(32).toString("base64");

    case "ADMIN_PASSWORD_HASH":
      // Generate a new random password and return bcrypt hash instructions
      const newPassword = crypto.randomBytes(16).toString("hex");
      return `MANUAL_ACTION_REQUIRED: Hash this password with bcrypt: ${newPassword}`;

    case "VAPID_PRIVATE_KEY":
      // Note: VAPID keys should be generated using web-push library
      return "MANUAL_ACTION_REQUIRED: Generate new VAPID keys using: npx web-push generate-vapid-keys";

    case "UPSTASH_REDIS_REST_TOKEN":
      return "MANUAL_ACTION_REQUIRED: Generate new token in Upstash Console";

    default:
      return crypto.randomBytes(32).toString("hex");
  }
}

/**
 * Load rotation records from file
 */
function loadRotationRecords(): RotationRecord[] {
  if (!fs.existsSync(ROTATION_FILE)) {
    // Initialize with current date if file doesn't exist
    const now = new Date().toISOString();
    const nextRotation = new Date(
      Date.now() + ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const records: RotationRecord[] = ROTATABLE_SECRETS.map((secret) => ({
      secretName: secret,
      lastRotated: now,
      nextRotation,
      rotationInterval: ROTATION_INTERVAL_DAYS,
    }));

    saveRotationRecords(records);
    return records;
  }

  return JSON.parse(fs.readFileSync(ROTATION_FILE, "utf-8"));
}

/**
 * Save rotation records to file
 */
function saveRotationRecords(records: RotationRecord[]): void {
  fs.writeFileSync(ROTATION_FILE, JSON.stringify(records, null, 2));
}

/**
 * Check rotation status for all secrets
 */
function checkRotationStatus(): RotationStatus {
  const records = loadRotationRecords();
  const now = new Date();

  const status: RotationStatus = {
    upToDate: [],
    needsRotation: [],
    overdue: [],
  };

  records.forEach((record) => {
    const nextRotation = new Date(record.nextRotation);
    const daysUntilRotation = Math.floor(
      (nextRotation.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilRotation > 30) {
      status.upToDate.push(record);
    } else if (daysUntilRotation > 0) {
      status.needsRotation.push(record);
    } else {
      status.overdue.push(record);
    }
  });

  return status;
}

/**
 * Perform secret rotation
 */
function rotateSecrets(force: boolean = false): void {
  const records = loadRotationRecords();
  const now = new Date();
  const rotatedSecrets: Array<{ name: string; value: string; manual: boolean }> = [];

  records.forEach((record) => {
    const nextRotation = new Date(record.nextRotation);
    const shouldRotate = force || now >= nextRotation;

    if (shouldRotate) {
      const newSecret = generateSecret(record.secretName);
      const isManual = newSecret.startsWith("MANUAL_ACTION_REQUIRED");

      rotatedSecrets.push({
        name: record.secretName,
        value: newSecret,
        manual: isManual,
      });

      // Update rotation record
      record.lastRotated = now.toISOString();
      record.nextRotation = new Date(
        now.getTime() + record.rotationInterval * 24 * 60 * 60 * 1000
      ).toISOString();
    }
  });

  if (rotatedSecrets.length === 0) {
    console.log("✅ No secrets need rotation at this time.\n");
    return;
  }

  // Save updated records
  saveRotationRecords(records);

  // Output new secrets
  console.log("\n🔐 SECRET ROTATION COMPLETE\n");
  console.log("=".repeat(60));
  console.log("\n⚠️  IMPORTANT: Update these secrets in your environment:\n");

  rotatedSecrets.forEach((secret) => {
    console.log(`\n${secret.name}:`);
    if (secret.manual) {
      console.log(`   ${secret.value}`);
    } else {
      console.log(`   ${secret.value}`);
      console.log(`   (Copy this value to your .env file)`);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("1. Update the secrets in your environment (.env, secrets manager, etc.)");
  console.log("2. Restart your application to use the new secrets");
  console.log("3. Verify everything works correctly");
  console.log("4. Remove old secrets from backup/recovery systems after verification");
  console.log("5. Update deployment pipelines with new secrets\n");

  // Create backup of rotation file
  const backupFile = path.join(__dirname, `../.secret-rotation.backup.${Date.now()}.json`);
  fs.copyFileSync(ROTATION_FILE, backupFile);
  console.log(`📦 Rotation record backed up to: ${backupFile}\n`);
}

/**
 * Display rotation status
 */
function displayStatus(status: RotationStatus): void {
  console.log("\n🔍 SECRET ROTATION STATUS\n");
  console.log("=".repeat(60));

  if (status.overdue.length > 0) {
    console.log("\n❌ OVERDUE (Immediate action required):\n");
    status.overdue.forEach((record) => {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(record.nextRotation).getTime()) / (24 * 60 * 60 * 1000)
      );
      console.log(`   ${record.secretName}`);
      console.log(`   Last rotated: ${new Date(record.lastRotated).toLocaleDateString()}`);
      console.log(`   Overdue by: ${daysOverdue} days\n`);
    });
  }

  if (status.needsRotation.length > 0) {
    console.log("\n⚠️  NEEDS ROTATION (Within 30 days):\n");
    status.needsRotation.forEach((record) => {
      const daysUntil = Math.floor(
        (new Date(record.nextRotation).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      console.log(`   ${record.secretName}`);
      console.log(`   Last rotated: ${new Date(record.lastRotated).toLocaleDateString()}`);
      console.log(
        `   Rotate in: ${daysUntil} days (${new Date(record.nextRotation).toLocaleDateString()})\n`
      );
    });
  }

  if (status.upToDate.length > 0) {
    console.log("\n✅ UP TO DATE (>30 days until rotation):\n");
    status.upToDate.forEach((record) => {
      const daysUntil = Math.floor(
        (new Date(record.nextRotation).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      console.log(`   ${record.secretName}`);
      console.log(
        `   Next rotation: ${new Date(record.nextRotation).toLocaleDateString()} (${daysUntil} days)\n`
      );
    });
  }

  console.log("=".repeat(60));

  // Recommendations
  if (status.overdue.length > 0) {
    console.log("\n🚨 ACTION REQUIRED:\n");
    console.log("   Run: npx tsx scripts/rotate-secrets.ts --rotate\n");
  } else if (status.needsRotation.length > 0) {
    console.log("\n💡 RECOMMENDATION:\n");
    console.log("   Plan secret rotation soon. Run with --rotate when ready.\n");
  } else {
    console.log("\n✨ All secrets are up to date. Next check in 30 days.\n");
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🔐 Secret Rotation Manager");

  switch (command) {
    case "--check":
      const status = checkRotationStatus();
      displayStatus(status);
      break;

    case "--rotate":
      console.log("\n⚠️  Starting secret rotation...\n");
      rotateSecrets(false);
      break;

    case "--force":
      console.log("\n⚠️  FORCING rotation of ALL secrets...\n");
      console.log("Are you sure? This will rotate all secrets regardless of schedule.");
      console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
      setTimeout(() => {
        rotateSecrets(true);
      }, 5000);
      break;

    default:
      console.log("\nUsage:");
      console.log("  npx tsx scripts/rotate-secrets.ts --check    # Check rotation status");
      console.log("  npx tsx scripts/rotate-secrets.ts --rotate   # Perform rotation");
      console.log("  npx tsx scripts/rotate-secrets.ts --force    # Force rotation\n");
      process.exit(1);
  }
}

main();
