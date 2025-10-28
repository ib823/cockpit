/**
 * Test Email Configuration
 *
 * Run this script to verify your SMTP settings are working correctly
 * Usage: npx tsx scripts/test-email.ts
 */

import nodemailer from 'nodemailer';

// Note: Environment variables are loaded from .env automatically by tsx

async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check if SMTP variables are set
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM;

  console.log('📋 Configuration Check:');
  console.log(`  SMTP_HOST: ${smtpHost ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SMTP_PORT: ${smtpPort ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SMTP_USER: ${smtpUser ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SMTP_PASS: ${smtpPass ? '✅ Set' : '❌ Missing'}`);
  console.log(`  EMAIL_FROM: ${emailFrom || 'noreply@keystone-app.com'}\n`);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('❌ Error: Missing SMTP configuration!');
    console.log('\nPlease set the following in your .env file:');
    console.log('  SMTP_HOST="smtp-relay.brevo.com"');
    console.log('  SMTP_PORT="587"');
    console.log('  SMTP_USER="your-email@gmail.com"');
    console.log('  SMTP_PASS="your-smtp-key"');
    console.log('\nSee BREVO_SETUP_GUIDE.md for detailed instructions.');
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Test connection
  console.log('🔌 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error: any) {
    console.log('❌ SMTP connection failed!');
    console.log('\nError details:', error.message);
    console.log('\nCommon fixes:');
    console.log('  1. Double-check SMTP_USER matches your Brevo account email');
    console.log('  2. Copy SMTP_PASS exactly from Brevo dashboard (starts with xkeysib-)');
    console.log('  3. Ensure no extra spaces in .env file');
    process.exit(1);
  }

  // Ask for test email
  const testEmail = process.argv[2] || smtpUser;
  console.log(`📧 Sending test email to: ${testEmail}`);

  try {
    const info = await transporter.sendMail({
      from: `"Keystone Test" <${emailFrom || 'noreply@keystone-app.com'}>`,
      to: testEmail,
      subject: '✅ Email Configuration Test - Success!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #0f172a; margin-bottom: 16px;">✅ Email Test Successful!</h1>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                Your Keystone email configuration is working perfectly!
              </p>
              <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Test Details:</strong><br>
                  Provider: Brevo (Sendinblue)<br>
                  Server: ${smtpHost}<br>
                  From: ${emailFrom || 'noreply@keystone-app.com'}
                </p>
              </div>
              <p style="color: #64748b; font-size: 14px;">
                You can now send magic links and access codes without any restrictions!
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}\n`);
    console.log('🎉 All tests passed! Your email configuration is ready to use.\n');
    console.log('Next steps:');
    console.log('  1. Check your inbox at:', testEmail);
    console.log('  2. Try the magic link flow at: http://localhost:3000/login');
    console.log('  3. Enter any email and click "Send Magic Link"');

  } catch (error: any) {
    console.log('❌ Failed to send test email!');
    console.log('\nError details:', error.message);
    console.log('\nThis might mean:');
    console.log('  1. The recipient email is invalid');
    console.log('  2. Your Brevo account needs verification');
    console.log('  3. You\'ve hit the daily sending limit (300 emails/day)');
    process.exit(1);
  }
}

// Run the test
testEmailConfig().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
