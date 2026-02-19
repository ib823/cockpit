import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@cockpit-app.com";

// Brevo (Sendinblue) SMTP transporter
const emailTransporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

function emailTemplate(code: string, magicLink?: string): string {
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
                <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Your Access is Ready</h2>
                <p style="margin: 0 0 24px 0; color: #64748b; font-size: 15px; line-height: 1.6;">
                  Welcome to Cockpit! Choose your preferred way to get started:
                </p>

                ${
                  magicLink
                    ? `
                <!-- Magic Link Button (Primary) -->
                <div style="margin: 24px 0;">
                  <a href="${magicLink}"
                     style="display: block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; text-align: center; padding: 16px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);">
                    🚀 Login Instantly
                  </a>
                  <p style="margin: 8px 0 0 0; text-align: center; color: #94a3b8; font-size: 13px;">
                    One-click access • Expires in 2 minutes
                  </p>
                </div>

                <!-- Divider -->
                <div style="display: flex; align-items: center; margin: 32px 0;">
                  <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                  <span style="padding: 0 16px; color: #94a3b8; font-size: 13px; font-weight: 500;">OR</span>
                  <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                </div>
                `
                    : ""
                }

                <!-- Code Box (Secondary/Fallback) -->
                <div style="margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; text-align: center;">
                    ${magicLink ? "Enter this code manually:" : "Use this code to set up your passkey:"}
                  </p>
                  <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
                    <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </div>
                </div>

                <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>Important:</strong> ${magicLink ? "Magic link expires in 2 minutes. Code expires in 7 days." : "This code expires in 7 days and can only be used once."}
                  </p>
                </div>

                <!-- Instructions -->
                <div style="margin-top: 32px;">
                  <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; font-weight: 600;">What happens next:</h3>
                  <ol style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                    ${
                      magicLink
                        ? `
                    <li style="margin-bottom: 8px;">Click "Login Instantly" for one-click access</li>
                    <li style="margin-bottom: 8px;">Or enter the code manually at the login page</li>
                    `
                        : `
                    <li style="margin-bottom: 8px;">Visit the login page</li>
                    <li style="margin-bottom: 8px;">Enter your email address</li>
                    <li style="margin-bottom: 8px;">Enter the 6-digit code above</li>
                    `
                    }
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

export async function sendAccessCode(email: string, code: string, magicLink?: string) {
  // Check if email transporter is configured
  if (!emailTransporter) {
    console.log("[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env");
    console.log("[Email] Dev mode - Would send to:", email);
    if (magicLink) {
      console.log("[Email] Magic link:", magicLink);
    }
    return { success: false, devMode: true };
  }

  try {
    await emailTransporter.sendMail({
      from: `"Cockpit" <${FROM_EMAIL}>`,
      to: email,
      subject: magicLink ? "🚀 Your Cockpit Access is Ready" : "Your Cockpit Access Code",
      html: emailTemplate(code, magicLink),
    });

    console.log(`[Email] Successfully sent to ${email} via SMTP`);
    return { success: true, provider: "smtp" };
  } catch (error) {
    console.error("[SMTP] Failed to send email:", error);
    return { success: false, error };
  }
}

/**
 * Send security-related emails (welcome, alerts, warnings, etc.)
 */
export async function sendSecurityEmail(
  email: string,
  subject: string,
  html: string
): Promise<{ success: boolean; provider?: string; error?: unknown; devMode?: boolean }> {
  // Check if email transporter is configured
  if (!emailTransporter) {
    console.log("[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env");
    console.log("[Email] Dev mode - Would send:", subject, "to", email);
    return { success: false, devMode: true };
  }

  try {
    await emailTransporter.sendMail({
      from: `"Cockpit Security" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    console.log(`[Email] Security email sent to ${email} via SMTP`);
    return { success: true, provider: "smtp" };
  } catch (error) {
    console.error("[SMTP] Failed to send security email:", error);
    return { success: false, error };
  }
}
