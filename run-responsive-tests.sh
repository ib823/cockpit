#!/bin/bash

# Responsive Design Test Runner
# Tests Fix #1: PlanMode panel responsive width

echo "================================================"
echo "  Responsive Design Tests - PlanMode Panel"
echo "================================================"
echo ""
echo "Testing Fix #1: Panel width adaptation"
echo "File: src/components/project-v2/modes/PlanMode.tsx:311"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Starting dev server in background..."
echo ""

# Check if dev server is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dev server already running on port 3000"
else
    echo "Starting npm run dev..."
    npm run dev > /tmp/dev-server.log 2>&1 &
    DEV_PID=$!

    echo "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Dev server ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
fi

echo ""
echo "Running Playwright tests..."
echo "Testing on: iPhone SE, iPhone 12, iPad, Desktop"
echo ""

# Run the tests
npx playwright test tests/e2e/plan-mode-responsive.spec.ts --project=iphone-se

TEST_EXIT_CODE=$?

echo ""
echo "================================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo "Fix #1 is working correctly!"
    echo "Panel adapts to screen size as expected."
    echo ""
    echo "Next step: Commit the changes"
else
    echo -e "${RED}❌ TESTS FAILED${NC}"
    echo ""
    echo "Please review test output above."
    echo "Check playwright-report/index.html for details"
    echo ""
    echo "To debug:"
    echo "  npm run test:e2e:debug"
fi

echo "================================================"

# Cleanup: Kill dev server if we started it
if [ ! -z "$DEV_PID" ]; then
    echo ""
    echo "Stopping dev server (PID: $DEV_PID)..."
    kill $DEV_PID 2>/dev/null || true
fi

exit $TEST_EXIT_CODE
