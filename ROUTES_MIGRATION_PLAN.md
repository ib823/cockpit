# Routes Migration Plan - Archive Old Routes ✅

## 🎯 **Migration Strategy**

Replace old routes with V3 versions and add redirects for backward compatibility.

---

## 📋 **Routes Analysis**

### **✅ Keep (Active & Different Purpose):**
- `/admin` - User management, security, approvals (NOT replaced by dashboard)
- `/admin/users` - User management
- `/admin/security` - Security dashboard
- `/admin/approvals` - Email approvals
- `/admin/recovery-requests` - Account recovery
- `/admin/email-approvals` - Email approval queue

**Reason**: Admin routes are for system administration, not project management. They serve a different purpose than the user-facing dashboard.

### **🔄 Redirect (Replaced by V3):**
1. `/gantt-tool` → `/gantt-tool/v3` (Timeline V3)
2. `/organization-chart` → `/architecture/v3` (if exists)
3. `/gantt-tool/projects` → `/gantt-tool/v3` (project list is now in dropdown)

### **📦 Archive (Keep but Disable):**
- `/gantt-tool/import-kpj` - Old import format (rarely used)
- `/gantt-tool/lppsa` - Legacy feature

---

## 🛠️ **Implementation Steps**

### **Step 1: Redirect `/gantt-tool` to `/gantt-tool/v3`**
Replace `/src/app/gantt-tool/page.tsx` content with redirect

### **Step 2: Keep Admin Routes**
Admin routes remain untouched - they're for system administration

### **Step 3: Update Navigation**
Ensure GlobalNav and dashboard cards point to V3 routes

### **Step 4: Archive Unused**
Move `/gantt-tool/import-kpj` and `/gantt-tool/lppsa` to `_archived` folder

---

## 📁 **Final Route Structure**

```
/src/app/
├── dashboard/              ✅ KEEP (Unified Dashboard)
├── gantt-tool/
│   ├── page.tsx           🔄 REDIRECT → /gantt-tool/v3
│   ├── v3/                ✅ KEEP (Timeline V3)
│   ├── _archived/         📦 ARCHIVE
│   │   ├── import-kpj/    (Legacy import)
│   │   └── lppsa/         (Legacy feature)
│   └── layout.tsx         ✅ KEEP
├── architecture/
│   └── v3/                ✅ KEEP (Architecture V3)
├── admin/                 ✅ KEEP (System Administration)
│   ├── page.tsx
│   ├── users/
│   ├── security/
│   ├── approvals/
│   ├── recovery-requests/
│   └── email-approvals/
└── organization-chart/     🔄 REDIRECT → /architecture/v3 (if desired)
```

---

## 🔗 **Redirect Configuration**

### **Method 1: Page-level Redirect (Recommended)**
Replace old page.tsx files with redirect components:

```typescript
// /src/app/gantt-tool/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GanttToolRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/gantt-tool/v3");
  }, [router]);

  return null; // or a loading spinner
}
```

### **Method 2: Middleware Redirect (Alternative)**
Add to middleware.ts:

```typescript
// Redirect old routes to V3
if (pathname === "/gantt-tool") {
  return NextResponse.redirect(new URL("/gantt-tool/v3", request.url));
}
if (pathname === "/organization-chart") {
  return NextResponse.redirect(new URL("/architecture/v3", request.url));
}
```

---

## ⚠️ **Important Notes**

### **DO NOT Remove:**
- `/admin/*` routes - Different purpose (system administration)
- API routes (`/api/gantt-tool/*`, `/api/admin/*`)
- Shared components in `/src/components/gantt-tool/*`
- Store files in `/src/stores/*`

### **Update References:**
1. Dashboard cards should link to:
   - `/gantt-tool/v3` (not `/gantt-tool`)
   - `/architecture/v3`

2. GlobalNav already points to correct routes:
   - Dashboard: `/dashboard` ✅
   - Timeline: `/gantt-tool/v3` ✅
   - Architecture: `/architecture/v3` ✅

---

## 🎨 **User Experience**

### **Before:**
- Multiple gantt tool versions (confusing)
- Inconsistent UI across pages
- Hard to navigate between tools

### **After:**
- Single Timeline V3 (consistent)
- GlobalNav for easy switching
- Old URLs automatically redirect
- Admin panel separate (clear purpose)

---

## 📊 **Benefits**

1. ✅ **Cleaner Codebase** - Remove duplicate/unused routes
2. ✅ **Better UX** - Consistent V3 interface everywhere
3. ✅ **Backward Compatible** - Old URLs redirect automatically
4. ✅ **Clear Separation** - Admin vs User features
5. ✅ **Future-Proof** - V3 is the foundation going forward

---

## 🚀 **Rollout Plan**

### **Phase 1: Redirects (Safe)**
- Add redirects for old routes
- Test that old URLs work
- Monitor for any broken links

### **Phase 2: Archive (After Testing)**
- Move unused routes to `_archived/`
- Add README explaining why archived
- Keep for reference if needed

### **Phase 3: Cleanup (Future)**
- After 30 days of no issues
- Consider removing archived routes
- Update documentation

---

**Recommendation**: Start with Phase 1 (redirects only). This is safe and reversible. Archiving can come later after we confirm everything works.
