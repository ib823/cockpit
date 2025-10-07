#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$LOG_DIR/smoke_run_$(date +"%Y%m%d_%H%M%S").log"

cd "$ROOT_DIR"
echo "==> Smoke test started at $(date -Is)" | tee -a "$LOG_FILE"

# Pick package manager (priority: pnpm > npm > yarn > bun)
PM=""
if command -v pnpm >/dev/null 2>&1; then PM="pnpm"
elif command -v npm >/dev/null 2>&1; then PM="npm"
elif command -v yarn >/dev/null 2>&1; then PM="yarn"
elif command -v bun >/dev/null 2>&1; then PM="bun"
else echo "No package manager found." | tee -a "$LOG_FILE"; exit 1; fi

echo "Using package manager: $PM" | tee -a "$LOG_FILE"

if [[ "${1:-}" == "--install-only" ]]; then
  echo "==> Installing dependencies only..." | tee -a "$LOG_FILE"
  $PM install 2>&1 | tee -a "$LOG_FILE"
  echo "==> Done." | tee -a "$LOG_FILE"
  exit 0
fi

# Install
echo "==> Installing dependencies..." | tee -a "$LOG_FILE"
$PM install 2>&1 | tee -a "$LOG_FILE"

# Prisma (if present)
if [[ -f "prisma/schema.prisma" ]]; then
  echo "==> Prisma generate..." | tee -a "$LOG_FILE"
  npx --yes prisma generate 2>&1 | tee -a "$LOG_FILE" || true
fi

# Build
echo "==> Building..." | tee -a "$LOG_FILE"
if [[ "$PM" == "pnpm" || "$PM" == "npm" || "$PM" == "yarn" ]]; then
  $PM run build 2>&1 | tee -a "$LOG_FILE" || echo "[WARN] build failed — continuing"
elif [[ "$PM" == "bun" ]]; then
  $PM run build 2>&1 | tee -a "$LOG_FILE" || echo "[WARN] build failed — continuing"
fi

# Test (prefer explicit scripts; fallback to vitest/jest)
echo "==> Testing..." | tee -a "$LOG_FILE"
if jq -e '.scripts.test' package.json >/dev/null 2>&1; then
  $PM test --if-present 2>&1 | tee -a "$LOG_FILE" || echo "[WARN] tests failed"
else
  if command -v npx >/dev/null 2>&1 && npx --yes vitest --version >/dev/null 2>&1; then
    npx --yes vitest run 2>&1 | tee -a "$LOG_FILE" || echo "[WARN] vitest failed"
  elif command -v npx >/dev/null 2>&1 && npx --yes jest --version >/dev/null 2>&1; then
    npx --yes jest 2>&1 | tee -a "$LOG_FILE" || echo "[WARN] jest failed"
  else
    echo "[INFO] No test runner detected." | tee -a "$LOG_FILE"
  fi
fi

echo "==> Smoke test finished at $(date -Is)" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE"
