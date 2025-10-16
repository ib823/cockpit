#!/bin/bash
set -e

echo "=== Security Hardening ==="

# 1. Fix npm vulnerabilities
echo "1. Fixing npm vulnerabilities..."
npm audit fix

# 2. Generate new secrets
echo "2. Generating new secrets..."
echo ""
echo "Add these to .env.local:"
echo "NEXTAUTH_SECRET=\"$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")\""
echo ""
echo "Generate password hash:"
echo "ADMIN_PASSWORD_HASH=\"$(node -e "console.log(require('bcryptjs').hashSync('ChangeMe123!', 10))")\""
echo ""

# 3. Update next.config.js
echo "3. Adding security headers..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
module.exports = nextConfig;
EOF

echo "✅ Security hardening complete!"
echo ""
echo "Manual steps:"
echo "1. Update .env.local with new secrets above"
echo "2. Sign up for Upstash Redis (free): https://console.upstash.com"
echo "3. Restart: npm run dev"