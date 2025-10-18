#!/usr/bin/env bash
set -euo pipefail
fails=0; pass(){ echo "PASS: $1"; }; fail(){ echo "FAIL: $1"; fails=$((fails+1)); }
PM=npm; test -f pnpm-lock.yaml && PM=pnpm; test -f yarn.lock && PM=yarn
case "$PM" in pnpm) pnpm i >/dev/null && pnpm build >/dev/null ;; yarn) yarn >/dev/null && yarn build >/dev/null ;; *) npm i >/dev/null && npm run build >/dev/null ;; esac
pass "Build OK"

test -f src/types/gantt.ts && pass "types/gantt.ts present" || fail "types missing"
test -f src/lib/excelPaste.ts && pass "lib/excelPaste.ts present" || fail "parser missing"
test -f src/app/gantt/import/page.tsx && pass "import page present" || fail "page missing"

grep -Eq "detectDelimiter\\(|parseTabular\\(|autoMap\\(|normalizeRows\\(" src/lib/excelPaste.ts && pass "core parser funcs" || fail "parser funcs missing"
grep -Eq "promoteHeaderRow\\(|looksLikeDateHeader\\(|forwardFill\\(" src/lib/excelPaste.ts && pass "KPJ grid helpers" || fail "KPJ helpers missing"
grep -Eq "Task Name|Start Date|Duration \\(Days\\)" src/lib/excelPaste.ts && pass "aliases include KPJ headers" || fail "aliases missing KPJ"

grep -Eq "KPI_IMPL_V1" src/app/gantt/import/page.tsx && pass "preset present" || fail "preset missing"
grep -Eq "Forward-fill" src/app/gantt/import/page.tsx && pass "forward-fill toggle present" || fail "ffill toggle missing"
grep -Eq "Preview" src/app/gantt/import/page.tsx && pass "preview step present" || fail "preview step missing"

echo "== SUMMARY =="; test $fails -eq 0 && { echo "ALL CHECKS PASSED"; exit 0; } || { echo "$fails check(s) failed"; exit 3; }
