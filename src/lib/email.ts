import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Gmail SMTP transporter (free option)
const gmailTransporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

function emailTemplate(code: string): string {
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300; letter-spacing: -0.5px;">Cockpit</h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 32px;">
                <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Your Access Code</h2>
                <p style="margin: 0 0 24px 0; color: #64748b; font-size: 15px; line-height: 1.6;">
                  Use this code to set up your passkey and access Cockpit:
                </p>

                <!-- Code Box -->
                <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace;">
                    \${code}
                  </div>
                </div>

                <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>Important:</strong> This code expires in 7 days and can only be used once.
                  </p>
                </div>

                <!-- Instructions -->
                <div style="margin-top: 32px;">
                  <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; font-weight: 600;">Next Steps:</h3>
                  <ol style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">Visit the login page</li>
                    <li style="margin-bottom: 8px;">Enter your email address</li>
                    <li style="margin-bottom: 8px;">Enter the 6-digit code above</li>
                    <li style="margin-bottom: 8px;">Set up your passkey (fingerprint/Face ID)</li>
                    <li>Start using Cockpit!</li>
                  </ol>
                </div>

                <!-- Security Notice -->
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                    🔒 <strong>Security Tip:</strong> After setup, you'll use your device's passkey (fingerprint or Face ID) to sign in. No passwords needed!
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          </body>
        </html>
`;
}

export async function sendAccessCode(email: string, code: string) {
  // Priority 1: Try Gmail SMTP (free, built-in)
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"Cockpit" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Cockpit Access Code',
        html: emailTemplate(code),
      });
      console.log('[Gmail] Email sent to:', email);
      return { success: true, provider: 'gmail' };
    } catch (error) {
      console.error('[Gmail] Failed to send email:', error);
      // Fall through to Resend
    }
  }

  // Priority 2: Try Resend API
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Your Cockpit Access Code',
        html: emailTemplate(code),
      });
      console.log('[Resend] Email sent to:', email);
      return { success: true, provider: 'resend' };
    } catch (error) {
      console.error('[Resend] Failed to send email:', error);
      return { success: false, error };
    }
  }

  // No email provider configured
  console.log('[DEV] Email not sent (no email provider configured). Code:', code);
  return { success: false, devMode: true };
}
