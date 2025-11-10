# 🎨 Company Branding & Theme Customization Guide

**Make this app yours!** This guide shows you how to customize colors, logos, and themes to match your company brand.

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Update Company Information**

Edit `/src/config/brand.ts`:

```typescript
export const company = {
  name: "Acme Solutions", // ← Your company name
  tagline: "SAP Excellence Delivered", // ← Your tagline

  website: "https://acmesolutions.com",
  email: "hello@acmesolutions.com",

  social: {
    linkedin: "https://linkedin.com/company/acme",
    twitter: "https://twitter.com/acme",
  },
};
```

### **Step 2: Add Your Logo**

1. **Prepare your logo files:**
   - SVG format (recommended) or PNG with transparency
   - Two versions: `logo-light.svg` (for light backgrounds) and `logo-dark.svg` (for dark mode)
   - Icon version: `icon.svg` (square, for favicon)

2. **Add to project:**

   ```bash
   # Place files in the /public folder
   /public/logo-light.svg
   /public/logo-dark.svg
   /public/icon.svg
   ```

3. **Update paths in** `/src/config/brand.ts`:

   ```typescript
   export const logo = {
     light: "/logo-light.svg", // ✓ Your light logo
     dark: "/logo-dark.svg", // ✓ Your dark logo
     icon: "/icon.svg", // ✓ Your icon
     alt: "Acme Solutions Logo",
   };
   ```

4. **Enable logo in** `/src/components/common/Logo.tsx`:
   ```typescript
   // Uncomment these lines (around line 37):
   <Image
     src={logoPath}
     alt={logo.alt}
     fill
     className="object-contain"
     priority
   />
   ```

### **Step 3: Customize Brand Colors**

Edit `/src/config/brand.ts` and replace with your brand colors:

```typescript
export const brandColors = {
  primary: {
    50: "#f0f9ff", // Lightest
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // ← Main brand color (buttons, links)
    600: "#0284c7", // ← Hover state
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e", // Darkest
  },

  accent: {
    500: "#8b5cf6", // ← Secondary color (highlights, CTAs)
    600: "#7c3aed",
  },
};
```

**How to pick colors:**

- Use your existing brand guidelines
- Generate shades with: https://uicolors.app/create
- Or use Tailwind's color palette: https://tailwindcss.com/docs/customizing-colors

---

## 🎨 Detailed Customization

### **Colors**

#### **1. Apply Your Brand Colors to Tailwind**

Edit `/tailwind.config.ts`:

```typescript
import { brandColors } from "./src/config/brand";

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: brandColors.primary[50],
          100: brandColors.primary[100],
          500: brandColors.primary[500],
          600: brandColors.primary[600],
          // ... add all shades
        },
        accent: {
          500: brandColors.accent[500],
          600: brandColors.accent[600],
        },
      },
    },
  },
};
```

#### **2. Update Design System Colors**

Edit `/src/lib/design-system.ts`:

```typescript
import { brandColors } from "@/config/brand";

export const colors = {
  primary: {
    500: `bg-[${brandColors.primary[500]}]`,
    600: `bg-[${brandColors.primary[600]}]`,
    // ...
  },
};
```

---

### **Logo Customization**

#### **Logo Specifications**

**Recommended formats:**

- **SVG:** Best choice (scalable, small file size)
- **PNG:** Use with transparency, 2x resolution for retina

**Dimensions:**

- Light/Dark logo: Horizontal layout, ~200px width, ~48px height
- Icon: Square, 512x512px minimum

**File size:**

- SVG: < 50KB
- PNG: < 100KB

#### **Logo Placement**

The Logo component is used in:

- Navigation bar (top-left)
- Login/auth pages
- Footer
- PDF exports
- Email templates

**To add logo to navigation:**

Edit `/src/components/layout/Navbar.tsx` (or create it):

```tsx
import { Logo } from "@/components/common/Logo";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 py-4">
        <Logo size="md" showText={true} />
      </div>
    </nav>
  );
}
```

---

### **Theme Customization**

#### **Border Radius (Roundness)**

Edit `/src/config/brand.ts`:

```typescript
export const theme = {
  borderRadius: "modern", // Choose: "sharp" | "modern" | "rounded"
};
```

- **Sharp:** No rounded corners (0px) - Modern, professional
- **Modern:** Subtle rounded (8-12px) - Friendly, balanced
- **Rounded:** Very rounded (16-24px) - Playful, soft

Then update `/src/lib/design-system.ts`:

```typescript
import { theme } from "@/config/brand";

export const radius = {
  sm:
    theme.borderRadius === "sharp"
      ? "rounded-none"
      : theme.borderRadius === "modern"
        ? "rounded-lg"
        : "rounded-xl",

  md:
    theme.borderRadius === "sharp"
      ? "rounded-none"
      : theme.borderRadius === "modern"
        ? "rounded-xl"
        : "rounded-2xl",

  lg:
    theme.borderRadius === "sharp"
      ? "rounded-none"
      : theme.borderRadius === "modern"
        ? "rounded-2xl"
        : "rounded-3xl",
};
```

#### **Shadows (Elevation)**

Edit `/src/config/brand.ts`:

```typescript
export const theme = {
  shadows: "subtle", // Choose: "none" | "subtle" | "pronounced"
};
```

- **None:** Flat design (Material Design style)
- **Subtle:** Soft shadows (recommended)
- **Pronounced:** Strong elevation (iOS style)

---

### **Fonts**

#### **Using Custom Fonts**

1. **Add font files to** `/public/fonts/`:

   ```
   /public/fonts/YourFont-Regular.woff2
   /public/fonts/YourFont-Bold.woff2
   ```

2. **Create font CSS** in `/src/app/globals.css`:

   ```css
   @font-face {
     font-family: "YourFont";
     src: url("/fonts/YourFont-Regular.woff2") format("woff2");
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }

   @font-face {
     font-family: "YourFont";
     src: url("/fonts/YourFont-Bold.woff2") format("woff2");
     font-weight: 700;
     font-style: normal;
     font-display: swap;
   }
   ```

3. **Update** `/src/config/brand.ts`:

   ```typescript
   export const theme = {
     fontFamily: {
       heading: "'YourFont', sans-serif",
       body: "'YourFont', sans-serif",
     },
   };
   ```

4. **Apply to Tailwind** in `/tailwind.config.ts`:

   ```typescript
   import { theme } from "./src/config/brand";

   module.exports = {
     theme: {
       extend: {
         fontFamily: {
           sans: [theme.fontFamily.body],
           heading: [theme.fontFamily.heading],
         },
       },
     },
   };
   ```

#### **Using Google Fonts**

1. **Add to** `/src/app/layout.tsx`:

   ```typescript
   import { Inter } from 'next/font/google';

   const inter = Inter({ subsets: ['latin'] });

   export default function RootLayout({ children }) {
     return (
       <html lang="en" className={inter.className}>
         <body>{children}</body>
       </html>
     );
   }
   ```

---

## 🌙 Dark Mode Support

### **Enable Dark Mode**

1. **Update** `/src/config/brand.ts`:

   ```typescript
   export const theme = {
     defaultMode: "system", // "light" | "dark" | "system"
     allowThemeToggle: true,
   };
   ```

2. **Create theme provider** `/src/providers/ThemeProvider.tsx`:

   ```typescript
   "use client";

   import { createContext, useContext, useEffect, useState } from "react";

   type Theme = "light" | "dark" | "system";

   const ThemeContext = createContext<{
     theme: Theme;
     setTheme: (theme: Theme) => void;
   }>({ theme: "light", setTheme: () => {} });

   export function ThemeProvider({ children }: { children: React.ReactNode }) {
     const [theme, setTheme] = useState<Theme>("system");

     useEffect(() => {
       const root = window.document.documentElement;
       root.classList.remove("light", "dark");

       if (theme === "system") {
         const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
           ? "dark"
           : "light";
         root.classList.add(systemTheme);
       } else {
         root.classList.add(theme);
       }
     }, [theme]);

     return (
       <ThemeContext.Provider value={{ theme, setTheme }}>
         {children}
       </ThemeContext.Provider>
     );
   }

   export const useTheme = () => useContext(ThemeContext);
   ```

3. **Add dark mode colors to** `/tailwind.config.ts`:

   ```typescript
   module.exports = {
     darkMode: "class",
     theme: {
       extend: {
         colors: {
           // Light mode
           background: "var(--background)",
           foreground: "var(--foreground)",
         },
       },
     },
   };
   ```

4. **Define CSS variables in** `/src/app/globals.css`:

   ```css
   @layer base {
     :root {
       --background: 255 255 255;
       --foreground: 17 24 39;
     }

     .dark {
       --background: 17 24 39;
       --foreground: 255 255 255;
     }
   }
   ```

---

## 😀 Emoji & Icon Customization

### **Emoji Settings**

Edit `/src/config/brand.ts`:

```typescript
export const icons = {
  useEmojis: true, // Set to false to disable emojis

  // Customize emojis used throughout the app
  success: "✅",
  error: "❌",
  warning: "⚠️",
  celebration: "🎉",
  rocket: "🚀",
  sparkles: "✨",
};
```

### **Replace Emojis with Icon Library**

If you prefer icon libraries (Lucide, Heroicons):

1. **Install:**

   ```bash
   # Already installed: lucide-react
   ```

2. **Update components to use icons instead:**

   ```tsx
   // Before (emoji)
   <span>🎉 Success!</span>

   // After (icon)
   <CheckCircle className="w-5 h-5 text-green-600" />
   ```

---

## 🌍 Regional Customization

### **Region Labels & Flags**

Edit `/src/config/brand.ts`:

```typescript
export const regions = {
  default: "ABMY",

  labels: {
    ABMY: "🇲🇾 Malaysia HQ", // ← Customize labels
    ABSG: "🇸🇬 Singapore Office",
    ABVN: "🇻🇳 Vietnam Office",
  },

  showFlags: true, // Set false to hide flags
};
```

---

## 📋 Checklist: Complete Branding

- [ ] **Company Info**
  - [ ] Update company name
  - [ ] Update tagline
  - [ ] Add website & email
  - [ ] Add social links

- [ ] **Logo**
  - [ ] Create logo-light.svg
  - [ ] Create logo-dark.svg
  - [ ] Create icon.svg
  - [ ] Place in /public folder
  - [ ] Update paths in brand.ts
  - [ ] Uncomment Image in Logo.tsx

- [ ] **Colors**
  - [ ] Define primary brand color (9 shades)
  - [ ] Define accent color
  - [ ] Update tailwind.config.ts
  - [ ] Update design-system.ts

- [ ] **Fonts**
  - [ ] Choose font family
  - [ ] Add font files (if custom)
  - [ ] Update tailwind.config.ts
  - [ ] Test readability

- [ ] **Theme**
  - [ ] Set border radius preference
  - [ ] Set shadow style
  - [ ] Enable/disable dark mode

- [ ] **Icons**
  - [ ] Customize emoji preferences
  - [ ] Or switch to icon library

- [ ] **Test**
  - [ ] View in browser
  - [ ] Check logo displays correctly
  - [ ] Verify colors match brand
  - [ ] Test dark mode (if enabled)

---

## 🎨 Brand Examples

### **Example 1: Tech Startup (Modern)**

```typescript
// brand.ts
export const company = {
  name: "NovaTech",
  tagline: "Future-Ready SAP Solutions",
};

export const brandColors = {
  primary: {
    500: "#6366f1", // Indigo
    600: "#4f46e5",
  },
  accent: {
    500: "#ec4899", // Pink
    600: "#db2777",
  },
};

export const theme = {
  borderRadius: "rounded", // Very rounded
  shadows: "pronounced", // Strong shadows
};
```

### **Example 2: Corporate (Professional)**

```typescript
// brand.ts
export const company = {
  name: "Enterprise Solutions Corp",
  tagline: "Trusted SAP Partner Since 2005",
};

export const brandColors = {
  primary: {
    500: "#1e40af", // Dark blue
    600: "#1e3a8a",
  },
  accent: {
    500: "#059669", // Green
    600: "#047857",
  },
};

export const theme = {
  borderRadius: "modern", // Subtle rounded
  shadows: "subtle", // Soft shadows
};
```

### **Example 3: Creative Agency (Bold)**

```typescript
// brand.ts
export const company = {
  name: "Spectrum Digital",
  tagline: "SAP with a Creative Edge",
};

export const brandColors = {
  primary: {
    500: "#f59e0b", // Orange
    600: "#d97706",
  },
  accent: {
    500: "#8b5cf6", // Purple
    600: "#7c3aed",
  },
};

export const theme = {
  borderRadius: "sharp", // No rounded corners
  shadows: "none", // Flat design
};
```

---

## 🚀 Next Steps

1. **Customize `/src/config/brand.ts`** with your company info
2. **Add your logo files** to `/public/`
3. **Update colors** in tailwind.config.ts
4. **Test in browser** - run `npm run dev`
5. **Iterate** until it matches your brand perfectly

---

## 💡 Pro Tips

**Tip 1:** Use your existing brand guidelines

- Extract exact hex colors from your logo
- Match your website's color scheme
- Keep it consistent across all platforms

**Tip 2:** Test color contrast

- Use https://webaim.org/resources/contrastchecker/
- Ensure text is readable (4.5:1 ratio minimum)
- Test with colorblind simulators

**Tip 3:** Start simple

- Get the logo and primary color right first
- Add more customizations later
- Don't overwhelm yourself with options

**Tip 4:** Document your choices

- Save your brand hex codes
- Take screenshots of the styled app
- Share with your team for feedback

---

**Questions?** Check `/src/config/brand.ts` for all available options.

**Last Updated:** October 4, 2025
