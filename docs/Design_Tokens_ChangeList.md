# Design Tokens Change List

**Source:** UX_UI_AUDIT_COMPLETE.md (Section 3 - Design system analysis)
**Cross-ref:** Holistic_Redesign_V2.md
**Date:** 2025-10-06

---

## 🎯 OBJECTIVE

Fix design token inconsistencies identified in audit and add dark mode support.

---

## ✅ CHANGES REQUIRED

### 1. Color Tokens (Move from Classes to HEX Values)

**Current Problem:** `design-system.ts` uses Tailwind classes (`bg-blue-600`) instead of HEX values.

**Solution:**

```typescript
// src/lib/design-tokens.ts (NEW FILE)

export const colors = {
  // Light mode (primary)
  light: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',  // Main brand
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // ... other colors
  },

  // Dark mode (inverted)
  dark: {
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      // ... inverted scale
    },
  },
} as const;
```

### 2. Typography Fixes

**Issue:** Fluid `clamp()` typography can cause accessibility problems.

**Fix:** Add opt-out for users who need fixed zoom:

```css
/* globals.css */
@media (prefers-reduced-data: reduce) {
  :root {
    --font-size-base: 16px; /* Fixed, not fluid */
  }
}
```

### 3. Unused Animation Cleanup

**Issue:** `glow` animation defined but never used (audit Section 3.2).

**Fix:** Either use it or remove it:

```javascript
// tailwind.config.js
animation: {
  // Remove if unused:
  // glow: "glow 2s ease-in-out infinite",

  // OR use for focus states:
  'focus-glow': 'glow 2s ease-in-out infinite',
}
```

### 4. Dark Mode Implementation

**Add CSS variables:**

```css
/* globals.css */
:root {
  --color-primary-600: #2563eb;
  --color-bg: #ffffff;
  --color-text-primary: #111827;
}

[data-theme="dark"] {
  --color-primary-600: #60a5fa;
  --color-bg: #111827;
  --color-text-primary: #f9fafb;
}
```

**Tailwind config:**

```javascript
module.exports = {
  darkMode: 'class', // Use data-theme attribute
  theme: {
    extend: {
      colors: {
        primary: {
          600: 'var(--color-primary-600)',
        },
        background: 'var(--color-bg)',
        foreground: 'var(--color-text-primary)',
      },
    },
  },
};
```

---

## 📁 FILES TO MODIFY

1. `src/lib/design-tokens.ts` - NEW (HEX color values)
2. `tailwind.config.js` - Import tokens, add dark mode
3. `src/app/globals.css` - Add CSS variables
4. `src/lib/design-system.ts` - Deprecate color classes section

---

**End of Design Tokens Change List**
