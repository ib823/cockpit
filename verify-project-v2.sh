#!/bin/bash
# Project V2 Verification Script

echo "🔍 Verifying Project V2 Installation..."
echo ""

errors=0

# Check component files
echo "📦 Checking component files..."
files=(
  "src/components/project-v2/ProjectShell.tsx"
  "src/components/project-v2/index.ts"
  "src/components/project-v2/modes/CaptureMode.tsx"
  "src/components/project-v2/modes/DecideMode.tsx"
  "src/components/project-v2/modes/PlanMode.tsx"
  "src/components/project-v2/modes/PresentMode.tsx"
  "src/components/project-v2/shared/ModeIndicator.tsx"
  "src/components/project-v2/shared/SlideOver.tsx"
  "src/components/project-v2/shared/EmptyState.tsx"
  "src/components/project-v2/shared/StatBadge.tsx"
  "src/components/project-v2/shared/LoadingState.tsx"
  "src/lib/utils.ts"
  "src/app/project/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing)"
    ((errors++))
  fi
done

# Check documentation
echo ""
echo "📚 Checking documentation..."
docs=(
  "docs/README.md"
  "docs/COMPLETION_SUMMARY.md"
  "docs/PROJECT_V2_TRANSFORMATION.md"
  "docs/DEPLOYMENT_GUIDE.md"
  "docs/QUICK_REFERENCE.md"
  "docs/BEFORE_AFTER_COMPARISON.md"
  "docs/FILE_MANIFEST.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (missing)"
    ((errors++))
  fi
done

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
deps=("framer-motion" "lucide-react" "clsx" "tailwind-merge")

for dep in "${deps[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep (not installed)"
    ((errors++))
  fi
done

echo ""
echo "═══════════════════════════════════════"
if [ $errors -eq 0 ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "🚀 Ready to test:"
  echo "   1. Run: pnpm dev"
  echo "   2. Visit: http://localhost:3001/project"
  echo "   3. Test all 4 modes"
else
  echo "❌ $errors error(s) found"
  echo "   Check the output above for details"
fi
echo "═══════════════════════════════════════"
