#!/bin/bash

# Vercel Deployment Setup Script
# This script helps you deploy the SAP Implementation Cockpit to Vercel

set -e

echo "=========================================="
echo "  SAP Cockpit - Vercel Deployment Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed.${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI is installed${NC}"
echo ""

# Generate secrets
echo -e "${BLUE}Generating secure secrets...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated NEXTAUTH_SECRET${NC}"
echo ""

# Save secrets to a temporary file for reference
cat > .env.vercel.reference << EOF
# ============================================================
# VERCEL ENVIRONMENT VARIABLES
# ============================================================
# Copy these to your Vercel dashboard
# Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
#
# IMPORTANT: Add these for ALL ENVIRONMENTS (Production, Preview, Development)
# ============================================================

# ============================================================
# DATABASE (REQUIRED)
# ============================================================
# Get from Vercel Postgres or external provider (Supabase/Neon)
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_URL_UNPOOLED=postgresql://user:password@host:5432/dbname?connection_limit=1

# ============================================================
# NEXTAUTH (REQUIRED)
# ============================================================
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://your-app.vercel.app

# ============================================================
# WEBAUTHN - Passkeys (REQUIRED)
# ============================================================
# Set after you know your Vercel domain
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app

# ============================================================
# ADMIN (OPTIONAL)
# ============================================================
ADMIN_EMAIL=admin@example.com

# ============================================================
# REDIS (OPTIONAL - Recommended for Production)
# ============================================================
# Get from Upstash: https://upstash.com
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# ============================================================
# EMAIL (OPTIONAL)
# ============================================================
# Get from Resend: https://resend.com
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com

# ============================================================
# MONITORING (OPTIONAL)
# ============================================================
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# ============================================================
# FEATURE FLAGS (OPTIONAL)
# ============================================================
ENABLE_PASSKEYS=true
ENABLE_MAGIC_LINKS=true

EOF

echo -e "${GREEN}✓ Environment variables template saved to: .env.vercel.reference${NC}"
echo ""

echo "=========================================="
echo "  DEPLOYMENT STEPS"
echo "=========================================="
echo ""

echo -e "${YELLOW}STEP 1: Login to Vercel${NC}"
echo "Run: ${BLUE}vercel login${NC}"
echo ""

echo -e "${YELLOW}STEP 2: Deploy (Preview)${NC}"
echo "Run: ${BLUE}vercel${NC}"
echo "  - This creates a preview deployment"
echo "  - Follow the prompts (accept defaults)"
echo ""

echo -e "${YELLOW}STEP 3: Setup Database${NC}"
echo ""
echo "Option A - Vercel Postgres (Easiest):"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Click on your project"
echo "  3. Go to Storage tab → Create Database → Postgres"
echo "  4. Vercel will automatically add DATABASE_URL to your environment"
echo "  5. Manually add DATABASE_URL_UNPOOLED with same URL + '?connection_limit=1'"
echo ""
echo "Option B - Supabase (Free Tier):"
echo "  1. Go to https://supabase.com"
echo "  2. Create new project"
echo "  3. Go to Settings → Database"
echo "  4. Copy connection string"
echo "  5. Add to Vercel env as DATABASE_URL and DATABASE_URL_UNPOOLED"
echo ""
echo "Option C - Neon (Serverless):"
echo "  1. Go to https://neon.tech"
echo "  2. Create new project"
echo "  3. Copy connection string"
echo "  4. Add to Vercel env as DATABASE_URL and DATABASE_URL_UNPOOLED"
echo ""

echo -e "${YELLOW}STEP 4: Configure Environment Variables${NC}"
echo "Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
echo ""
echo "Add these variables (copy from .env.vercel.reference):"
echo "  ✓ DATABASE_URL"
echo "  ✓ DATABASE_URL_UNPOOLED"
echo "  ✓ NEXTAUTH_SECRET (already generated above)"
echo "  ✓ NEXTAUTH_URL (update with your actual Vercel domain)"
echo "  ✓ WEBAUTHN_RP_ID (your domain without https://)"
echo "  ✓ WEBAUTHN_ORIGIN (your domain with https://)"
echo ""
echo "IMPORTANT: Add for ALL environments (Production, Preview, Development)"
echo ""

echo -e "${YELLOW}STEP 5: Run Database Migrations${NC}"
echo "After deploying and setting up database:"
echo "  ${BLUE}vercel env pull .env.production.local${NC}"
echo "  ${BLUE}pnpm prisma migrate deploy${NC}"
echo ""

echo -e "${YELLOW}STEP 6: Deploy to Production${NC}"
echo "Run: ${BLUE}vercel --prod${NC}"
echo ""

echo "=========================================="
echo "  QUICK REFERENCE"
echo "=========================================="
echo ""
echo "Your generated secrets:"
echo -e "${GREEN}NEXTAUTH_SECRET:${NC} $NEXTAUTH_SECRET"
echo ""
echo "Full environment template: ${BLUE}.env.vercel.reference${NC}"
echo ""
echo "Commands:"
echo "  Login:      ${BLUE}vercel login${NC}"
echo "  Preview:    ${BLUE}vercel${NC}"
echo "  Production: ${BLUE}vercel --prod${NC}"
echo "  Logs:       ${BLUE}vercel logs${NC}"
echo ""
echo "Dashboard: ${BLUE}https://vercel.com/dashboard${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "  Setup Complete! Ready to Deploy 🚀"
echo "==========================================${NC}"
echo ""
echo "Start with: ${BLUE}vercel login${NC}"
echo ""
