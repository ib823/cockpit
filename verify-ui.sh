#!/usr/bin/env bash
set -euo pipefail
fails=0; pass(){ echo "PASS: $1"; }; fail(){ echo "FAIL: $1"; fails=$((fails+1)); }

# Header/nav: no /gantt or /estimator anchors inside header/nav contexts
if rg -n -U "(?s)<(header|nav)[\\s\\S]{0,2400}href=['\\\"]/gantt" src -S >/dev/null 2>&1; then
  fail "Header/nav still contains link to /gantt"
else pass "Header/nav cleaned (/gantt)"; fi
if rg -n -U "(?s)<(header|nav)[\\s\\S]{0,2400}href=['\\\"]/estimator" src -S >/dev/null 2>&1; then
  fail "Header/nav still contains link to /estimator"
else pass "Header/nav cleaned (/estimator)"; fi

# Header/topbar component files must not have labels
if rg -n "Gantt Tool|Estimator" src/**/{Header,header,Navbar,navbar,Topbar,topbar,AppBar,Toolbar,layout}.{tsx,ts,jsx,js} -S >/dev/null 2>&1; then
  fail "Header/topbar still shows 'Gantt Tool' or 'Estimator' labels"
else pass "Header/topbar labels removed"; fi

# Buttons: ensure no hover-only visibility on <button> or Logout
if rg -n "<button[^>]*className=.*opacity-0" src -S >/dev/null 2>&1; then
  fail "<button> still uses opacity-0"
else pass "No <button> uses opacity-0"; fi
if rg -n "Logout" src | rg -n "opacity-0|group-hover:opacity|hover:opacity-100|pointer-events-none" -S >/dev/null 2>&1; then
  fail "Logout still uses hover-only/inert classes"
else pass "Logout visible/clickable by default"; fi

# Overlay safety wired
test -f src/components/OverlaySafety.tsx && pass "OverlaySafety component exists" || fail "OverlaySafety missing"
if rg -n "OverlaySafety" -g "layout.tsx" -g "layout.ts" -g "layout.jsx" -g "layout.js" src/app -S >/dev/null 2>&1; then
  pass "OverlaySafety injected into layout(s)"
else fail "OverlaySafety not injected into any layout"; fi

# CSS guardrails present (if globals.css exists)
if [ -f src/app/globals.css ]; then
  if rg -n "Overlay safety|header a\\[href=\"/gantt\"\\]" src/app/globals.css -S >/dev/null 2>&1; then
    pass "Overlay safety + header kill-switch CSS present"
  else
    fail "Overlay safety + header kill-switch CSS missing"
  fi
else
  echo "NOTE: globals.css not found; CSS guards skipped"
fi

echo "== SUMMARY =="; test $fails -eq 0 && { echo "ALL CHECKS PASSED"; exit 0; } || { echo "$fails check(s) failed"; exit 3; }
