# 🧪 SAP RFP Diagram Generator - Comprehensive Test Checklist

**Version:** 1.0
**Last Updated:** 2025-11-11
**Total Test Cases:** 50+

---

## 📋 Test Execution Instructions

### Prerequisites
- [ ] Development server running on `http://localhost:3000`
- [ ] Browser: Chrome/Firefox/Safari/Edge (latest version)
- [ ] Open DevTools (F12) to check for console errors
- [ ] Clear browser cache/cookies before testing
- [ ] Disable browser extensions (ad blockers, etc.)

---

## Test Suite 1: Page Load & Navigation (10 test cases)

### Test 1.1: Initial Page Load
- [ ] Navigate to `http://localhost:3000/architecture`
- [ ] Expected: Page loads without errors
- [ ] Check: No red errors in browser console
- [ ] Check: Title says "SAP RFP Diagram Generator"
- [ ] Verify: Step indicator shows 6 steps (System Context, Module, Integration, Deployment, Security, Sizing)

### Test 1.2: Wizard Layout
- [ ] Check: Left side has form (2/5 width)
- [ ] Check: Right side has diagram preview (3/5 width)
- [ ] Check: Both panels visible on desktop
- [ ] Check: Step progress indicator visible at top
- [ ] Check: Next/Back buttons visible at bottom

### Test 1.3: Initial State
- [ ] Verify: Step 1 (System Context) selected
- [ ] Verify: Form is empty (no pre-filled data)
- [ ] Verify: Diagram shows "Fill form to see diagram"
- [ ] Verify: Back button is DISABLED
- [ ] Verify: Next button is ENABLED

### Test 1.4: Navigation Between Steps
- [ ] Click Next → Should go to Step 2
- [ ] Verify: Step 2 (Module Architecture) form loads
- [ ] Click Back → Should return to Step 1
- [ ] Verify: Form data from Step 1 is still there (persistence)
- [ ] Click Next → Go to Step 2 again
- [ ] Click Next → Go to Step 3 (Integration)
- [ ] Verify: Can navigate through all 6 steps

### Test 1.5: Step Completion Status
- [ ] Step 1: Should show ○ (not complete - no data)
- [ ] Fill Step 1 form completely
- [ ] Step 1: Should show ✓ (complete)
- [ ] Navigate to Step 2 without filling it
- [ ] Step 2: Should show ○ (incomplete)
- [ ] Return to Step 1: Should show ✓

### Test 1.6: Step Completion Validation (Step 1)
- [ ] Leave all Step 1 fields empty
- [ ] Step indicator shows incomplete: ○
- [ ] Try to mark as complete: Should not allow advancing
- [ ] Fill Client Name: "ABC Manufacturing"
- [ ] Fill Project Name: "SAP S/4HANA Implementation"
- [ ] Add 1 Actor
- [ ] Add 1 External System
- [ ] Step shows: ✓ (complete)

### Test 1.7: Step Completion Validation (Step 2)
- [ ] Go to Step 2
- [ ] Leave form empty
- [ ] Should show: ○ (incomplete)
- [ ] Fill "Database Type": "SAP HANA"
- [ ] Add 1 Functional Area with 1 Module
- [ ] Should show: ✓ (complete)

### Test 1.8: Responsiveness
- [ ] Resize browser to 1920px wide → Both panels visible
- [ ] Resize to 1024px wide → Both panels visible, smaller
- [ ] Resize to 768px (tablet) → Check layout (should work)
- [ ] Check mobile (375px) → Should stack or scroll

### Test 1.9: Browser Console
- [ ] Open DevTools Console (F12)
- [ ] No RED errors should appear
- [ ] Yellow warnings are acceptable
- [ ] Interact with all forms
- [ ] Console should remain clean

### Test 1.10: Memory Leaks
- [ ] Navigate between steps 10 times rapidly
- [ ] Monitor memory in DevTools Performance tab
- [ ] Should not show growing memory usage
- [ ] DevTools should show <100MB for this app

---

## Test Suite 2: Form Input & Data Binding (15 test cases)

### Test 2.1: System Context Form - Project Info
- [ ] Type in "Client Name" field: "YTL Cement Berhad"
- [ ] Type in "Project Name": "SAP S/4 Cement"
- [ ] Type in "Industry": "Cement Manufacturing"
- [ ] Type in "Description": "Test description"
- [ ] Leave form
- [ ] Verify: All values are retained when returning

### Test 2.2: Add & Remove Actors
- [ ] Click "Add Actor" button
- [ ] A new actor card appears
- [ ] Fill: Name = "Plant Manager", Role = "Operations"
- [ ] Add activity: "• Manages production schedule"
- [ ] Click delete icon on actor
- [ ] Actor is removed
- [ ] Add 3 actors
- [ ] Delete middle actor
- [ ] Verify: Other 2 actors remain intact

### Test 2.3: Add & Remove External Systems
- [ ] Click "Add System" button
- [ ] Fill: Name = "Weighbridge", Type = "Industrial Control"
- [ ] Fill: Purpose = "Captures material weight"
- [ ] Fill: Integration = "XML via SFTP"
- [ ] Click delete → System is removed
- [ ] Add 4 external systems
- [ ] Verify: All systems show in list

### Test 2.4: Module Architecture Form - Functional Areas
- [ ] Go to Step 2
- [ ] Click "Add Functional Area"
- [ ] Type: "Finance & Controlling"
- [ ] Click "Add Module"
- [ ] Fill: Code="FI", Name="Financial Accounting", Scope="GL, AP, AR"
- [ ] Add another module: Code="CO", Name="Controlling"
- [ ] Verify: Both modules visible

### Test 2.5: Delete Modules & Areas
- [ ] Delete the "CO" module
- [ ] "FI" module remains
- [ ] Delete the "Finance & Controlling" area
- [ ] Area and all modules deleted
- [ ] Verify: Form is empty again

### Test 2.6: Database & Middleware Input
- [ ] Type Database Type: "SAP HANA"
- [ ] Type Size: "2TB RAM, 10TB storage"
- [ ] Type Notes: "Highly available setup"
- [ ] Type Middleware: "SAP BTP"
- [ ] Type Description: "Handles all integrations"
- [ ] Verify: All fields retain data

### Test 2.7: Integration Architecture Form
- [ ] Go to Step 3
- [ ] Click "Add Interface"
- [ ] Fill all fields with test data
- [ ] Add 5 interfaces
- [ ] Delete interface #3
- [ ] Verify: 4 interfaces remain

### Test 2.8: Deployment Architecture Form - Infrastructure
- [ ] Go to Step 4
- [ ] Fill "Deployment Model": "On-premise"
- [ ] Fill "Location": "Kuala Lumpur Data Center"
- [ ] Fill "Backup": "Daily incremental"
- [ ] Fill "DR": "Hot standby"
- [ ] Fill "Network": "1Gbps dedicated"
- [ ] Verify: All data persists

### Test 2.9: Add Environments & Servers
- [ ] Click "Add Environment"
- [ ] Type Name: "Production"
- [ ] Click "Add Server"
- [ ] Fill: Type="App Server", Count=3, Specs="64vCPU, 256GB"
- [ ] Add DB server: Type="Database Server", Count=1
- [ ] Click delete on 1 server
- [ ] Verify: One server deleted, other remains

### Test 2.10: Security Architecture Form
- [ ] Go to Step 5
- [ ] Add 2 authentication methods
- [ ] Add 3 security control layers
- [ ] Add compliance standards
- [ ] Delete 1 auth method
- [ ] Verify: Data structure correct

### Test 2.11: Sizing & Scalability Form - Phases
- [ ] Go to Step 6
- [ ] Add Phase: "Phase 1 - Pilot"
- [ ] Users: 51
- [ ] Timeline: "Months 1-6"
- [ ] Add transaction type: "Purchase Orders", Volume: "750/month"
- [ ] Add another transaction
- [ ] Delete one transaction
- [ ] Verify: Phase and transactions persist

### Test 2.12: Add Multiple Phases
- [ ] Add Phase 2: "Phase 2 - Main Rollout"
- [ ] Add Phase 3: "Phase 3 - Optimization"
- [ ] Delete Phase 2
- [ ] Verify: Phase 1 and 3 remain, order preserved

### Test 2.13: Scalability Input
- [ ] Fill Approach: "Horizontal scaling"
- [ ] Fill Limits: "Up to 500 concurrent users"
- [ ] Verify: Text saved

### Test 2.14: Form Validation - Empty Fields
- [ ] Go to Step 1
- [ ] Clear Client Name field
- [ ] Step indicator should show: ○ (incomplete)
- [ ] Fill Client Name again
- [ ] Step should show: ✓ (complete)

### Test 2.15: Special Characters in Input
- [ ] Add Actor with name: "Manager/Coordinator"
- [ ] Add System with name: "SAP-Integrations (Legacy)"
- [ ] Add module scope: "GL, AP, AR & CSM"
- [ ] Verify: Special chars saved correctly (don't break diagram)

---

## Test Suite 3: Diagram Generation & Preview (15 test cases)

### Test 3.1: System Context Diagram - Empty
- [ ] Go to Step 1
- [ ] Diagram shows: "Fill form to see diagram"
- [ ] This is expected

### Test 3.2: System Context Diagram - With Data
- [ ] Fill Step 1 completely (Project, Actors, Systems)
- [ ] Diagram should render with actors and systems
- [ ] Verify: No errors in console
- [ ] Verify: Diagram is visible

### Test 3.3: System Context Diagram Content
- [ ] Diagram should show:
  - [ ] Project name at center
  - [ ] Actors on left side
  - [ ] External systems on right side
  - [ ] Arrows connecting them

### Test 3.4: Module Architecture Diagram
- [ ] Fill Step 2 completely
- [ ] Switch preview to "Module Architecture"
- [ ] Diagram should render modules
- [ ] Should show database
- [ ] Should show middleware connections

### Test 3.5: Integration Architecture Diagram
- [ ] Fill Step 3 with 3+ interfaces
- [ ] Switch preview to "Integration"
- [ ] Should render as sequence diagram
- [ ] Should show data flow between systems

### Test 3.6: Deployment Architecture Diagram
- [ ] Fill Step 4 with environments and servers
- [ ] Switch preview to "Deployment"
- [ ] Should show environment boxes
- [ ] Should show servers grouped by environment

### Test 3.7: Security Architecture Diagram
- [ ] Fill Step 5 with auth methods and controls
- [ ] Switch preview to "Security"
- [ ] Should show security layers
- [ ] Should show compliance block

### Test 3.8: Sizing & Scalability Diagram
- [ ] Fill Step 6 with phases
- [ ] Switch preview to "Sizing"
- [ ] Should show phase progression
- [ ] Should show scalability limits

### Test 3.9: Diagram Preview Dropdown
- [ ] At bottom left of diagram, there's a dropdown
- [ ] Click dropdown
- [ ] Should show all 6 diagram types
- [ ] Select each one
- [ ] Diagram should switch immediately

### Test 3.10: Zoom Controls
- [ ] Click Zoom In button (+)
- [ ] Diagram should get larger (150%)
- [ ] Click Zoom In again
- [ ] Diagram should get even larger (200%)
- [ ] Click Zoom Out (-)
- [ ] Diagram should shrink
- [ ] Zoom percentage should display

### Test 3.11: Zoom Limits
- [ ] Click Zoom In repeatedly 10 times
- [ ] Should not zoom beyond 200%
- [ ] Click Zoom Out repeatedly 10 times
- [ ] Should not zoom below 50%

### Test 3.12: Export SVG Button
- [ ] Fill a complete form (all steps)
- [ ] Go to Step 1
- [ ] Click "Export" button in diagram panel
- [ ] Should download a file: "system-context.svg"
- [ ] File should be valid SVG (can open in browser)

### Test 3.13: Export All 6 Diagrams
- [ ] Switch preview to each diagram type
- [ ] Click Export for each
- [ ] Should download 6 files:
  - [ ] system-context.svg
  - [ ] module-architecture.svg
  - [ ] integration.svg
  - [ ] deployment.svg
  - [ ] security.svg
  - [ ] sizing.svg

### Test 3.14: Diagram Rendering Errors
- [ ] Fill Step 1 with special characters: "@#$%^&*()"
- [ ] Diagram should still render (or show error gracefully)
- [ ] Error message should be readable
- [ ] Should not crash the page

### Test 3.15: Live Diagram Updates
- [ ] Fill Step 1 completely
- [ ] Diagram renders for System Context
- [ ] Change Actor name
- [ ] Diagram should update immediately (within 1 second)
- [ ] Add new actor
- [ ] Diagram updates to show new actor

---

## Test Suite 4: Data Persistence (10 test cases)

### Test 4.1: Form Data Persists on Navigation
- [ ] Fill Step 1 with test data
- [ ] Go to Step 2
- [ ] Go back to Step 1
- [ ] Verify: All data is still there (not lost)

### Test 4.2: Local Storage Persistence
- [ ] Fill all 6 steps with test data
- [ ] Open DevTools → Application → Local Storage
- [ ] Should have key: "sap-rfp-architecture-storage"
- [ ] Value should be a JSON string
- [ ] JSON should contain all your data

### Test 4.3: Page Refresh Persistence
- [ ] Fill all 6 steps
- [ ] Press F5 to refresh page
- [ ] All data should be restored
- [ ] Current step should be remembered
- [ ] Diagrams should render with your data

### Test 4.4: Close & Reopen Tab
- [ ] Fill all steps
- [ ] Close the browser tab
- [ ] Reopen: http://localhost:3000/architecture
- [ ] Data should be restored

### Test 4.5: Multiple Tabs
- [ ] Open architecture page in Tab A
- [ ] Fill some data
- [ ] Open same URL in Tab B
- [ ] Tab B should have same data (shared storage)
- [ ] Edit data in Tab A
- [ ] Refresh Tab B
- [ ] Tab B should show Tab A's changes

### Test 4.6: Clear Data - Reset Button
- [ ] Fill all steps
- [ ] Look for "Reset" button (if exists)
- [ ] Click Reset
- [ ] All data should be cleared
- [ ] Should return to Step 1

### Test 4.7: IndexedDB Check
- [ ] DevTools → Application → IndexedDB
- [ ] Zustand might store data here
- [ ] Check if data is stored
- [ ] Data should match form inputs

### Test 4.8: Storage Limit Test
- [ ] Add 50 actors to Step 1
- [ ] Add 50 external systems
- [ ] Data should still save (localStorage limit is 5-10MB)
- [ ] No error should appear

### Test 4.9: Concurrent Edit Prevention
- [ ] Open same URL in 2 browser windows (not tabs)
- [ ] Edit data in Window A
- [ ] Switch to Window B
- [ ] One window's changes should not overwrite the other
- [ ] Or both should sync (if implemented)

### Test 4.10: Data Recovery
- [ ] Fill Step 1 completely
- [ ] Delete localStorage entry manually (via DevTools)
- [ ] Refresh page
- [ ] Should reset to empty form
- [ ] This is expected (data was deleted)

---

## Test Suite 5: Error Handling & Edge Cases (8 test cases)

### Test 5.1: Very Long Text Input
- [ ] Add Actor with 500-char name
- [ ] Should handle gracefully (no crash)
- [ ] Diagram might truncate text

### Test 5.2: Unicode & Emoji
- [ ] Add Actor: "张经理 (Manager) 🚀"
- [ ] Should save correctly
- [ ] Diagram should render (or handle gracefully)

### Test 5.3: HTML Injection Attempt
- [ ] Try: "<script>alert('XSS')</script>" in input
- [ ] Should save as text (not execute)
- [ ] No alert should pop up
- [ ] Text should be escaped

### Test 5.4: Rapid Form Switching
- [ ] Quickly click Next/Back 20 times
- [ ] Should not crash
- [ ] Should not lose data
- [ ] Should handle gracefully

### Test 5.5: Missing Data in Export
- [ ] Fill only Step 1
- [ ] Skip Steps 2-6 (leave empty)
- [ ] Try to export each diagram
- [ ] Diagrams for empty steps should show placeholder
- [ ] Or show error message

### Test 5.6: Very Large Numbers
- [ ] Phase users: 999,999,999
- [ ] Transaction volume: "999,999,999,999/month"
- [ ] Should display without breaking layout

### Test 5.7: Null/Undefined Handling
- [ ] If a field accidentally becomes null
- [ ] App should not crash
- [ ] Should show default value or empty

### Test 5.8: Network Disconnection
- [ ] Turn off WiFi/Network
- [ ] App should still work (offline-first)
- [ ] Data should still save locally
- [ ] Turn network back on
- [ ] Should be no errors

---

## Test Suite 6: Browser Compatibility (7 test cases)

### Test 6.1: Chrome (Latest)
- [ ] Run all above tests
- [ ] Should pass 100%

### Test 6.2: Firefox (Latest)
- [ ] Run critical tests (1.x, 2.x, 3.x series)
- [ ] Should work identically

### Test 6.3: Safari (Latest)
- [ ] Test on macOS Safari
- [ ] Test Zustand persistence (might use different API)
- [ ] Should work

### Test 6.4: Edge (Latest)
- [ ] Test on Windows Edge
- [ ] Should work identically to Chrome

### Test 6.5: Mobile Browser (iOS Safari)
- [ ] iPhone 12+: Open page
- [ ] Should be usable (layout responsive)
- [ ] Zoom/scroll should work

### Test 6.6: Android Browser
- [ ] Android 12+: Open page
- [ ] Should be usable
- [ ] Touch interactions should work

### Test 6.7: Old Browser (IE11)
- [ ] Not required (unsupported)
- [ ] If needs to work, will need polyfills

---

## Test Suite 7: Performance (5 test cases)

### Test 7.1: Page Load Time
- [ ] Clear cache
- [ ] Load page
- [ ] Should load in <3 seconds
- [ ] Check DevTools Performance tab

### Test 7.2: Diagram Render Time
- [ ] Fill all steps with moderate data
- [ ] Change preview tabs
- [ ] Each diagram should render in <1 second

### Test 7.3: Zoom Performance
- [ ] Zoom in/out 10 times rapidly
- [ ] Should be smooth (no lag)
- [ ] No janky animation

### Test 7.4: Input Responsiveness
- [ ] Type in a text field
- [ ] Should respond immediately (no lag)
- [ ] Diagram should update in <500ms

### Test 7.5: Memory Stability
- [ ] Add 100 actors, 100 systems, etc.
- [ ] Memory usage should stay <200MB
- [ ] No memory leak indication

---

## ✅ Final Sign-Off

- [ ] All test suites passed
- [ ] No console errors
- [ ] No data loss
- [ ] Diagrams render correctly
- [ ] Performance is acceptable
- [ ] Browser compatibility verified

**Tester Name:** _______________
**Date:** _______________
**Browser:** _______________
**Result:** ☐ PASS ☐ FAIL

---

## 🐛 Bug Report Template

```
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**

**Actual Result:**

**Screenshots/Videos:**

**Browser:**
**OS:**
**Console Errors:** Yes / No
```

---

## 📞 Support

For issues or questions, contact the development team.
