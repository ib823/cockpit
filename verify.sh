#!/usr/bin/env bash
set -euo pipefail
# Detect package manager
if [[ -f pnpm-lock.yaml ]]; then PM="pnpm"; INSTALL="$PM i"; BUILD="$PM run build"
elif [[ -f yarn.lock ]]; then PM="yarn"; INSTALL="$PM"; BUILD="$PM build"
else PM="npm"; INSTALL="$PM i"; BUILD="$PM run build"; fi
fails=0
pass(){ echo "PASS: $1"; }
fail(){ echo "FAIL: $1"; fails=$((fails+1)); }
assert_file(){ [[ -f "$2" ]] && pass "$1" || fail "$1 (missing $2)"; }
assert_grep(){ local pat="$2" file="$3"; [[ -f "$file" ]] && grep -Eq "$pat" "$file" && pass "$1" || fail "$1 (not in $file)"; }
echo "== Install & Build =="
$INSTALL >/dev/null 2>&1 || { echo "Install failed"; exit 1; }
$BUILD >/dev/null 2>&1 || { echo "Build failed"; exit 1; }
echo "Build OK"
echo "== Checks =="
# 1) Email-status endpoint
assert_file "email-status route" "src/app/api/auth/email-status/route.ts"
assert_grep "email-status returns registered/invited" "registered.*invited|needsAction" "src/app/api/auth/email-status/route.ts"
# 2) Email-first login (passkey hero OR invite code fallback)
assert_file "Email-first login page" "src/app/login/page.tsx"
assert_grep "Login checks email-status" "email-status|/api/auth/email-status" "src/app/login/page.tsx"
assert_grep "Login has passkey flow" "begin-login.*finish-login|navigator.credentials.get" "src/app/login/page.tsx"
assert_grep "Login has invite flow" "inviteCode|invite" "src/app/login/page.tsx"
# 3) Gantt import with validated roles
assert_file "Gantt import page" "src/app/gantt/import/page.tsx"
assert_grep "Import uses parseTasksSection" "parseTasksSection" "src/app/gantt/import/page.tsx"
assert_grep "Import uses parseResourcesSection" "parseResourcesSection" "src/app/gantt/import/page.tsx"
assert_grep "Import validates catalog" "validateAllocationsAgainstCatalog" "src/app/gantt/import/page.tsx"
assert_file "pilotImport lib" "src/lib/pilotImport.ts"
assert_grep "parseTasksSection exists" "export function parseTasksSection" "src/lib/pilotImport.ts"
assert_grep "parseResourcesSection exists" "export function parseResourcesSection" "src/lib/pilotImport.ts"
assert_grep "Week regex present" "W[0-9]|WEEK_RE" "src/lib/pilotImport.ts"
assert_file "resourceCatalog lib" "src/lib/resourceCatalog.ts"
assert_grep "validateAllocationsAgainstCatalog exists" "export function validateAllocationsAgainstCatalog" "src/lib/resourceCatalog.ts"
assert_grep "Validation throws on unmapped" "unknownRoles|throw new Error" "src/lib/resourceCatalog.ts"
assert_file "resources.json catalog" "src/config/resources.json"
assert_grep "Catalog has pm role" "\"pm\"|Project Manager" "src/config/resources.json"
assert_file "excelPaste lib" "src/lib/excelPaste.ts"
assert_grep "parseTabular exists" "export function parseTabular" "src/lib/excelPaste.ts"
assert_file "Gantt types" "src/types/gantt.ts"
assert_grep "ResourceWeekAlloc type exists" "ResourceWeekAlloc" "src/types/gantt.ts"
assert_grep "ResourceWeekAlloc has roleName" "roleName" "src/types/gantt.ts"
echo "== Summary =="
[[ $fails -gt 0 ]] && { echo "FAILED: $fails check(s)"; exit 2; } || { echo "ALL CHECKS PASSED"; exit 0; }
