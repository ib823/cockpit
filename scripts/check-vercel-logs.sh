#!/bin/bash

echo "🔍 Checking Vercel deployment and logs..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Install with: npm i -g vercel"
    exit 1
fi

echo "📋 Recent deployments:"
vercel ls --limit 5

echo ""
echo "📊 Latest production logs (filtering for API errors):"
echo "Run this command to see live logs:"
echo ""
echo "  vercel logs --follow --limit 100"
echo ""
echo "Or to see logs from the PATCH endpoint specifically:"
echo ""
echo "  vercel logs --follow | grep -i 'PATCH\|error\|failed'"
echo ""
