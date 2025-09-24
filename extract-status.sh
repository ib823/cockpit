#!/bin/bash
echo "=== REPOSITORY STATUS EXTRACTION ==="
echo "Date: $(date)"
echo "Repository: $(pwd)"
echo ""

echo "=== GIT STATUS ==="
git status
echo ""

echo "=== GIT LOG (Last 20 commits) ==="
git log --oneline -20
echo ""

echo "=== FILE STRUCTURE ==="
tree -I 'node_modules|.next|.git' -L 3
echo ""

echo "=== PACKAGE.JSON ==="
cat package.json
echo ""

echo "=== DEPENDENCIES INSTALLED ==="
pnpm list --depth=0
echo ""

echo "=== SOURCE FILES CREATED/MODIFIED ==="
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -newer .git/FETCH_HEAD 2>/dev/null | head -20
echo ""

echo "=== TIMELINE FILES ==="
ls -la src/data/*.ts
ls -la src/lib/timeline/*.ts
ls -la src/stores/timeline-store.ts
ls -la src/app/timeline/page.tsx
echo ""

echo "=== LINE COUNTS ==="
echo "Total TypeScript lines in src:"
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1
echo ""

echo "=== BUILD STATUS ==="
pnpm build 2>&1 | tail -10
echo ""

echo "=== ENVIRONMENT ==="
node --version
pnpm --version
echo "Next.js: $(grep '"next":' package.json | cut -d'"' -f4)"
echo ""
