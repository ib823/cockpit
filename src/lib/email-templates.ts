/**
 * Email Templates for Security & Authentication
 *
 * All templates are responsive, accessible, and follow email best practices
 */

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Keystone';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// ============================================
// 1. Welcome Email (Post-Registration)
// ============================================
export function welcomeEmailTemplate(data: {
  email: string;
  passwordExpiryDate: Date;
}): { subject: string; html: string } {
  const expiryDate = data.passwordExpiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: `Welcome to ${APP_NAME} - Your Account is Ready`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Welcome to ${APP_NAME}!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-center; width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%;">
          <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>

      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 600; text-align: center;">Your Account is All Set</h2>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6; text-align: center;">
        Welcome, <strong>${data.email}</strong>! Your account has been created with enterprise-grade security.
      </p>

      <!-- Security Features -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Your Security Setup</h3>
        <div style="space-y: 12px;">
          <div style="display: flex; align-items: start; margin-bottom: 12px;">
            <span style="color: #22c55e; font-size: 20px; margin-right: 12px;">✓</span>
            <div>
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Strong Password Protection</strong>
              <span style="color: #64748b; font-size: 14px;">Your password is encrypted with bcrypt (cost factor 12)</span>
            </div>
          </div>
          <div style="display: flex; align-items: start; margin-bottom: 12px;">
            <span style="color: #22c55e; font-size: 20px; margin-right: 12px;">✓</span>
            <div>
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Two-Factor Authentication (TOTP)</strong>
              <span style="color: #64748b; font-size: 14px;">6-digit codes from your authenticator app</span>
            </div>
          </div>
          <div style="display: flex; align-items: start;">
            <span style="color: #22c55e; font-size: 20px; margin-right: 12px;">✓</span>
            <div>
              <strong style="color: #0f172a; display: block; margin-bottom: 4px;">10 Backup Recovery Codes</strong>
              <span style="color: #64748b; font-size: 14px;">Keep these safe in case you lose your device</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Important Information -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Important Dates</h4>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li><strong>Password expires:</strong> ${expiryDate} (90 days)</li>
          <li>You'll receive reminders at 75, 85, and 90 days</li>
          <li>You cannot reuse your last 5 passwords</li>
        </ul>
      </div>

      <!-- Quick Start -->
      <div style="margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">What to Do Next</h3>
        <ol style="margin: 0; padding-left: 20px; color: #64748b; font-size: 15px; line-height: 1.8;">
          <li style="margin-bottom: 8px;">Make sure you saved your backup codes securely</li>
          <li style="margin-bottom: 8px;">Add ${APP_NAME} to your browser bookmarks</li>
          <li style="margin-bottom: 8px;">Set up trusted devices for faster login</li>
          <li>Explore the dashboard and start your first project</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);">
          Go to Dashboard
        </a>
      </div>

      <!-- Security Tips -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">Security Tips</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
          <li>Never share your password or TOTP codes with anyone</li>
          <li>We'll never ask for your password via email</li>
          <li>If you receive a suspicious login alert, click "Not Me" immediately</li>
          <li>Enable device fingerprinting for better security tracking</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
        Need help? Contact us at <a href="mailto:support@example.com" style="color: #3b82f6; text-decoration: none;">support@example.com</a>
      </p>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

// ============================================
// 2. New Device Login Alert
// ============================================
export function newDeviceLoginTemplate(data: {
  email: string;
  deviceInfo: string;
  location: string;
  ipAddress: string;
  timestamp: Date;
  notMeToken: string;
}): { subject: string; html: string } {
  const formattedTime = data.timestamp.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return {
    subject: `New Device Login to ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-center; width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin-bottom: 16px;">
        <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">New Device Login Detected</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${data.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        We detected a login to your account from a new device. If this was you, you can safely ignore this email.
      </p>

      <!-- Login Details -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Login Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Time:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Device:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${data.deviceInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Location:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${data.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">IP Address:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${data.ipAddress}</td>
          </tr>
        </table>
      </div>

      <!-- Action Required -->
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">Wasn't You?</h4>
        <p style="margin: 0 0 16px 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
          If you didn't make this login, click the button below immediately to secure your account.
        </p>
      </div>

      <!-- Not Me Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/security/revoke?token=${data.notMeToken}"
           style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
          This Wasn't Me - Secure My Account
        </a>
      </div>

      <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
        This link expires in 5 minutes
      </p>

      <!-- What Happens -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What Happens When You Click "Not Me"?</h4>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li>All active sessions will be terminated</li>
          <li>All passkeys will be revoked</li>
          <li>TOTP will be reset (requires re-enrollment)</li>
          <li>Password change will be required</li>
          <li>Account will be temporarily locked</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated security alert. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

// ============================================
// 3. Password Expiry Warning
// ============================================
export function passwordExpiryWarningTemplate(data: {
  email: string;
  daysRemaining: number;
  expiryDate: Date;
}): { subject: string; html: string } {
  const expiryDate = data.expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const urgency = data.daysRemaining <= 5 ? 'high' : 'medium';

  return {
    subject: `Password Expires in ${data.daysRemaining} Day${data.daysRemaining === 1 ? '' : 's'}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${urgency === 'high' ? '#dc2626' : '#f59e0b'} 0%, ${urgency === 'high' ? '#991b1b' : '#d97706'} 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Password Expiry Reminder</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${data.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Your password will expire in <strong style="color: ${urgency === 'high' ? '#dc2626' : '#f59e0b'};">${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'}</strong> on <strong>${expiryDate}</strong>.
      </p>

      <!-- Warning Box -->
      <div style="background: ${urgency === 'high' ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${urgency === 'high' ? '#dc2626' : '#f59e0b'}; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: ${urgency === 'high' ? '#991b1b' : '#92400e'}; font-size: 14px; line-height: 1.6;">
          ${urgency === 'high'
            ? 'Please change your password now to avoid being locked out of your account.'
            : 'We recommend changing your password soon to maintain account security.'}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/settings/security"
           style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);">
          Change Password Now
        </a>
      </div>

      <!-- Password Requirements -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Password Requirements</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
          <li>At least 12 characters long</li>
          <li>Mix of uppercase and lowercase letters</li>
          <li>At least one number</li>
          <li>At least one special character</li>
          <li>Not found in breach databases (HIBP check)</li>
          <li>Cannot reuse your last 5 passwords</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated reminder. © ${new Date().getFullYear()} ${APP_NAME}.
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

// ============================================
// 4. Backup Code Used Alert
// ============================================
export function backupCodeUsedTemplate(data: {
  email: string;
  codesRemaining: number;
  usedAt: Date;
}): { subject: string; html: string } {
  const formattedTime = data.usedAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return {
    subject: `Backup Code Used - ${data.codesRemaining} Remaining`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Backup Code Used</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${data.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        One of your backup recovery codes was used to access your account at <strong>${formattedTime}</strong>.
      </p>

      <!-- Warning Box -->
      <div style="background: ${data.codesRemaining <= 2 ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${data.codesRemaining <= 2 ? '#dc2626' : '#f59e0b'}; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: ${data.codesRemaining <= 2 ? '#991b1b' : '#92400e'}; font-size: 16px; font-weight: 600;">
          ${data.codesRemaining} Code${data.codesRemaining === 1 ? '' : 's'} Remaining
        </h4>
        <p style="margin: 0; color: ${data.codesRemaining <= 2 ? '#991b1b' : '#92400e'}; font-size: 14px; line-height: 1.6;">
          ${data.codesRemaining <= 2
            ? 'You are running low on backup codes. Generate new codes immediately to avoid lockout.'
            : 'You have enough codes remaining, but consider generating new ones soon.'}
        </p>
      </div>

      <!-- CTA Button -->
      ${data.codesRemaining <= 2 ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/settings/security"
           style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
          Generate New Backup Codes
        </a>
      </div>
      ` : ''}

      <!-- Info Box -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What are backup codes?</h4>
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          Backup codes are single-use codes that allow you to access your account if you lose your authenticator device. Once a code is used, it cannot be used again.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated security alert. © ${new Date().getFullYear()} ${APP_NAME}.
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

// ============================================
// 5. Account Locked Alert
// ============================================
export function accountLockedTemplate(data: {
  email: string;
  reason: string;
  lockedAt: Date;
}): { subject: string; html: string } {
  const formattedTime = data.lockedAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return {
    subject: `Security Alert: Account Locked`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-center; width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin-bottom: 16px;">
        <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Account Locked</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${data.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Your account was automatically locked at <strong>${formattedTime}</strong> for security reasons.
      </p>

      <!-- Reason Box -->
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">Reason:</h4>
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
          ${data.reason}
        </p>
      </div>

      <!-- Recovery Options -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">How to Unlock Your Account</h3>
        <ol style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
          <li style="margin-bottom: 8px;">Use a backup recovery code to regain access</li>
          <li style="margin-bottom: 8px;">Contact support with your account details</li>
          <li style="margin-bottom: 8px;">Verify your identity with government ID</li>
          <li>Reset your password and TOTP settings</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/support"
           style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);">
          Contact Support
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated security alert. © ${new Date().getFullYear()} ${APP_NAME}.
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}
