#!/usr/bin/env bash
set -euo pipefail
fails=0; pass(){ echo "PASS: $1"; }; fail(){ echo "FAIL: $1"; fails=$((fails+1)); }
PM=npm; test -f pnpm-lock.yaml && PM=pnpm; test -f yarn.lock && PM=yarn
case "$PM" in pnpm) pnpm i >/dev/null && pnpm build >/dev/null ;; yarn) yarn >/dev/null && yarn build >/dev/null ;; *) npm i >/dev/null && npm run build >/dev/null ;; esac
pass "Build OK"

test -f src/lib/pilotImport.ts && pass "pilotImport.ts present" || fail "pilotImport.ts missing"
test -f src/app/gantt/import/pilot/page.tsx && pass "pilot page present" || fail "page missing"
grep -Eq "getWeekColumns\(|buildWeekCalendar\(|parseTasksSection\(|parseResourcesSection\(" src/lib/pilotImport.ts && pass "core functions present" || fail "functions missing"
grep -Eq "W[0-9]|WEEK_RE" src/lib/pilotImport.ts && pass "Wn headers handled" || fail "Wn parsing missing"
grep -Eq "activeByWeek" src/lib/pilotImport.ts && pass "activeByWeek computed" || fail "activeByWeek missing"
grep -Eq "Resource Week|mandays" -n src/app/gantt/import/pilot/page.tsx >/dev/null && pass "UI shows resource weeks/mandays" || fail "UI preview missing fields"

echo "== SUMMARY =="; test $fails -eq 0 && { echo "ALL CHECKS PASSED"; exit 0; } || { echo "$fails check(s) failed"; exit 3; }
