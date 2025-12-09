# Universal UI/UX System Prompt

> A comprehensive, reusable UI/UX system for building consistent, accessible, and responsive web applications. Extracted from production-tested patterns.

---

## Quick Start Checklist

When starting a new project, apply in this order:

1. [ ] Install required packages
2. [ ] Configure Tailwind with design tokens
3. [ ] Create utility functions (`cn` helper)
4. [ ] Set up global CSS with resets and tokens
5. [ ] Create base UI components (Button, Input, Card, etc.)
6. [ ] Implement layout shell with responsive navigation
7. [ ] Add application-specific component variants

---

## 1. Required Packages

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install -D tailwindcss autoprefixer postcss @tailwindcss/typography
```

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "lucide-react": "^0.555.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.15",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6",
    "@tailwindcss/typography": "^0.5.19"
  }
}
```

### Package Purposes

| Package | Purpose |
|---------|---------|
| `class-variance-authority` | Type-safe component variants (CVA pattern) |
| `clsx` | Conditional class name composition |
| `tailwind-merge` | Smart Tailwind class merging (prevents conflicts) |
| `lucide-react` | Consistent, lightweight icon library |
| `@tailwindcss/typography` | Prose styling for rich text content |

---

## 2. Tailwind Configuration

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ===========================================
      // COLOR SYSTEM
      // Semantic colors for consistent theming
      // ===========================================
      colors: {
        // Core UI colors
        foreground: '#0F172A',      // Primary text (dark slate)
        muted: '#64748B',           // Secondary text (slate)
        background: '#FFFFFF',      // Main background (pure white)
        surface: '#F8FAFC',         // Elevated surfaces (light slate)
        border: '#E2E8F0',          // Borders (light border)
        accent: '#3B82F6',          // Primary actions (blue)

        // Status colors
        success: '#22C55E',         // Success states (green)
        warning: '#F59E0B',         // Warning states (amber)
        error: '#EF4444',           // Error states (red)
        info: '#3B82F6',            // Informational states (blue)

        // ===========================================
        // APPLICATION-SPECIFIC SEMANTIC COLORS
        // Replace these with your domain-specific colors
        // ===========================================
        // Example: Risk/Criticality levels
        'critical': '#DC2626',      // Red - Critical/High Risk
        'high': '#EA580C',          // Orange - High/Elevated
        'medium': '#D97706',        // Amber - Medium/Moderate
        'low': '#6B7280',           // Gray - Low/General
      },

      // ===========================================
      // TYPOGRAPHY SYSTEM
      // Consistent type scale with proper hierarchy
      // ===========================================
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
        overline: ['11px', { lineHeight: '1.5', letterSpacing: '0.08em', fontWeight: '500' }],
      },

      // ===========================================
      // SPACING SYSTEM
      // Based on 4px grid
      // ===========================================
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-6': '24px',
        'space-8': '32px',
        'space-12': '48px',
      },

      // ===========================================
      // RESPONSIVE BREAKPOINTS
      // Mobile-first approach
      // ===========================================
      screens: {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px',
        'desktop-xl': '1440px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

---

## 3. PostCSS Configuration

Create `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 4. Utility Functions

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support (Shadcn/ui pattern)
 * Combines clsx for conditional classes with tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with comma separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString();
}

/**
 * Format percentage with % suffix
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Format date to readable string (DD MMM YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date with time (DD MMM YYYY, HH:MM)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Safely parse an integer from a string with default value
 * Security: Prevents NaN propagation in query parameters
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  let result = parsed;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return result;
}
```

---

## 5. Global CSS

Create or update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * Global Styles
 * CSS Reset + Custom utility classes
 */

/* ===========================================
   CSS RESET
   =========================================== */

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

/* ===========================================
   CUSTOM UTILITY CLASSES
   =========================================== */

/* Text truncation with line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===========================================
   RESPONSIVE GRID LAYOUTS
   =========================================== */

/* KPI/Stats Grid - Responsive 5-column layout */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

/* Card Grid - Auto-fit responsive */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Details Grid - Responsive auto-fill */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem 1.5rem;
}

@media (max-width: 480px) {
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem 1rem;
  }
}

/* Two Column Grid - Responsive */
.two-column-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 900px) {
  .two-column-grid {
    grid-template-columns: 1fr;
  }
}

/* ===========================================
   FORM LAYOUTS
   =========================================== */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row > .form-group {
  flex: 1;
  min-width: 200px;
}

@media (max-width: 767px) {
  .form-row {
    flex-direction: column;
  }
}

/* ===========================================
   LIST ITEM STYLING
   =========================================== */

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #E2E8F0;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background-color: #F8FAFC;
}

.list-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.list-item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* ===========================================
   STAT/KPI CARDS
   =========================================== */

.stat-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 1.25rem;
  min-width: 200px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: 0.25rem;
}

@media (max-width: 600px) {
  .stat-value {
    font-size: 1.5rem;
  }
}

/* ===========================================
   DETAIL FIELD STYLING
   =========================================== */

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0F172A;
  word-break: break-word;
}

/* ===========================================
   SECTION STYLING
   =========================================== */

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #E2E8F0;
}

/* ===========================================
   EMPTY & ERROR STATES
   =========================================== */

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #64748B;
}

/* ===========================================
   CHART CONTAINERS
   =========================================== */

.chart-container {
  padding: 1rem;
  height: 300px;
  min-height: 250px;
}

@media (max-width: 600px) {
  .chart-container {
    height: 250px;
    padding: 0.75rem;
  }
}

/* ===========================================
   BREADCRUMB NAVIGATION
   =========================================== */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  min-height: 32px;
}

.breadcrumb-link {
  color: #3B82F6;
  text-decoration: none;
  font-weight: 500;
  padding: 0.25rem 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-link:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  border-radius: 4px;
}

.breadcrumb-separator {
  color: #64748B;
}

.breadcrumb-current {
  color: #0F172A;
  font-weight: 600;
}

/* ===========================================
   MONOSPACE TEXT (IDs, codes, etc.)
   =========================================== */

.monospace-id {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
}
```

---

## 6. Base UI Components

### 6.1 Button Component

Create `src/components/ui/button.tsx`:

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white shadow hover:bg-accent/90',
        destructive: 'bg-error text-white shadow-sm hover:bg-error/90',
        outline: 'border border-border bg-background shadow-sm hover:bg-surface hover:text-foreground',
        secondary: 'bg-surface text-foreground shadow-sm hover:bg-surface/80',
        ghost: 'hover:bg-surface hover:text-foreground',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        // UX: All sizes meet 44px minimum touch target (WCAG 2.5.5)
        default: 'h-11 px-4 py-2',
        sm: 'h-10 rounded-md px-3 text-sm',
        lg: 'h-12 rounded-md px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 6.2 Input Component

Create `src/components/ui/input.tsx`:

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### 6.3 Card Component

Create `src/components/ui/card.tsx`:

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-background text-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### 6.4 Badge Component

Create `src/components/ui/badge.tsx`:

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-white shadow',
        secondary: 'border-transparent bg-surface text-foreground',
        destructive: 'border-transparent bg-error text-white shadow',
        outline: 'text-foreground',
        success: 'border-transparent bg-success text-white',
        warning: 'border-transparent bg-warning text-white',
        // Application-specific variants (customize these)
        critical: 'border-transparent bg-critical text-white',
        high: 'border-transparent bg-high text-white',
        medium: 'border-transparent bg-medium text-white',
        low: 'border-transparent bg-low text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### 6.5 Alert Component

Create `src/components/ui/alert.tsx`:

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        info: 'border-info/50 text-info bg-info/10 [&>svg]:text-info',
        destructive: 'border-error/50 text-error bg-error/10 [&>svg]:text-error',
        warning: 'border-warning/50 text-warning bg-warning/10 [&>svg]:text-warning',
        success: 'border-success/50 text-success bg-success/10 [&>svg]:text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
```

### 6.6 Label Component

Create `src/components/ui/label.tsx`:

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
```

### 6.7 Table Component

Create `src/components/ui/table.tsx`:

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-surface/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-surface/50 data-[state=selected]:bg-surface',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
```

### 6.8 Tabs Component

Create `src/components/ui/tabs.tsx`:

```typescript
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const currentValue = value ?? internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (onValueChange) {
          onValueChange(newValue);
        } else {
          setInternalValue(newValue);
        }
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn('', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-surface p-1 text-muted',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive && 'bg-background text-foreground shadow',
          className
        )}
        onClick={() => context.onValueChange(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.value !== value) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

### 6.9 Skeleton Component

Create `src/components/ui/skeleton.tsx`:

```typescript
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface', className)}
      {...props}
    />
  );
}

/**
 * Table skeleton - generic table loading state
 */
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-surface border-b border-border p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="border-b border-border last:border-0 p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton - generic card loading state
 */
function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-4 border border-border rounded-lg space-y-3">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}

/**
 * Page loading skeleton - full page centered loading state
 */
function PageLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Empty state component - clean, minimal empty state
 */
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p className="text-lg font-medium text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Error state component - clean error display
 */
function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p className="text-lg font-medium text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  PageLoadingSkeleton,
  EmptyState,
  ErrorState,
};
```

### 6.10 Separator Component

Create `src/components/ui/separator.tsx`:

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator';

export { Separator };
```

### 6.11 Component Index

Create `src/components/ui/index.ts`:

```typescript
export * from './button';
export * from './input';
export * from './card';
export * from './badge';
export * from './alert';
export * from './label';
export * from './table';
export * from './tabs';
export * from './skeleton';
export * from './separator';
```

---

## 7. Layout Components

### 7.1 App Shell (Sidebar Layout)

Create `src/components/layout/app-shell.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, FileText, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  appName: string;
  appTagline?: string;
  user?: {
    name: string;
    email: string;
  };
}

// Customize navigation items for your application
const navItems = [
  { key: 'dashboard', href: '/', icon: Home, text: 'Dashboard' },
  { key: 'search', href: '/search', icon: Search, text: 'Search' },
  { key: 'reports', href: '/reports', icon: FileText, text: 'Reports' },
  { key: 'settings', href: '/settings', icon: Settings, text: 'Settings' },
];

export function AppShell({ children, appName, appTagline }: AppShellProps) {
  const pathname = usePathname();
  // Default to collapsed for cleaner initial view and better mobile UX
  const [sideNavCollapsed, setSideNavCollapsed] = useState(true);

  const handleMenuClick = () => {
    setSideNavCollapsed(!sideNavCollapsed);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 bg-[#354a5f] text-white flex items-center px-4 shadow-md z-10">
        <button
          onClick={handleMenuClick}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors mr-3"
          aria-label="Toggle navigation"
        >
          {sideNavCollapsed ? <Menu size={24} /> : <X size={24} />}
        </button>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">{appName}</span>
          {appTagline && (
            <>
              <span className="hidden sm:inline text-white/70 text-sm">|</span>
              <span className="hidden sm:inline text-white/70 text-sm">{appTagline}</span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation */}
        <aside
          className={cn(
            'bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out',
            sideNavCollapsed ? 'w-0 overflow-hidden' : 'w-60'
          )}
        >
          <nav className="flex-1 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      setSideNavCollapsed(true);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 min-h-[44px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
                    active
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 8. Design Principles

### 8.1 Accessibility (WCAG 2.1 Compliance)

| Requirement | Implementation |
|------------|----------------|
| Touch Targets | All interactive elements are minimum 44x44px (WCAG 2.5.5) |
| Color Contrast | All text meets 4.5:1 contrast ratio minimum |
| Focus Indicators | Visible focus rings on all interactive elements |
| Keyboard Navigation | Full keyboard support with logical tab order |
| Screen Readers | Semantic HTML and ARIA labels where needed |

### 8.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 600px | Single column, collapsed sidebar |
| Tablet | 600-900px | 2-column grids, collapsible sidebar |
| Desktop | 900-1280px | 3-column grids, sidebar available |
| Desktop XL | > 1280px | 5-column grids, full layout |

### 8.3 Animation & Transitions

```css
/* Standard transition timing */
transition: background-color 0.15s ease;
transition: border-color 0.15s ease;
transition: box-shadow 0.15s ease;
transition-all 0.2s ease-in-out; /* Layout changes */
```

- Keep animations minimal (0.15s-0.2s)
- Use `ease` or `ease-in-out` easing
- Avoid flashy or distracting effects
- Skeleton loaders use Tailwind's `animate-pulse`

### 8.4 Color System Philosophy

**Semantic Colors:**
- Use semantic color names (`success`, `error`, `warning`, `info`)
- Never hardcode hex values in components
- All colors defined in Tailwind config

**Application-Specific Colors:**
- Define domain-specific colors for your data (e.g., risk levels, status states)
- Keep consistent across the application
- Ensure sufficient contrast for badges and indicators

---

## 9. Application-Specific Customization Guide

### 9.1 Customizing Colors for Vigil (SoD Portal)

In `tailwind.config.ts`, replace the application-specific colors:

```typescript
colors: {
  // ... keep all base colors (foreground, muted, etc.)

  // For Vigil Risk/Compliance:
  'critical': '#DC2626',   // CRITICAL violations - dark red
  'high': '#EA580C',       // HIGH risk - orange
  'medium': '#F59E0B',     // MEDIUM risk - amber
  'low': '#22C55E',        // LOW risk - green (safe)

  // Status colors for exceptions/remediations
  'pending': '#F59E0B',    // Pending items - amber
  'approved': '#22C55E',   // Approved - green
  'rejected': '#EF4444',   // Rejected - red
  'in-review': '#3B82F6',  // In review - blue
}
```

### 9.2 Adding Badge Variants for Vigil

In `src/components/ui/badge.tsx`, update variants:

```typescript
const badgeVariants = cva(/* base classes */, {
  variants: {
    variant: {
      // Base variants (keep these)
      default: 'border-transparent bg-accent text-white shadow',
      secondary: 'border-transparent bg-surface text-foreground',
      destructive: 'border-transparent bg-error text-white shadow',
      outline: 'text-foreground',
      success: 'border-transparent bg-success text-white',
      warning: 'border-transparent bg-warning text-white',

      // Vigil risk level variants
      critical: 'border-transparent bg-critical text-white',
      high: 'border-transparent bg-high text-white',
      medium: 'border-transparent bg-medium text-white',
      low: 'border-transparent bg-low text-white',

      // Vigil status variants
      pending: 'border-transparent bg-pending text-white',
      approved: 'border-transparent bg-approved text-white',
      rejected: 'border-transparent bg-rejected text-white',
      'in-review': 'border-transparent bg-in-review text-white',
    },
  },
});
```

### 9.3 Customizing Navigation for Vigil

In `src/components/layout/app-shell.tsx`, update `navItems`:

```typescript
import {
  Home,
  AlertTriangle,
  Shield,
  FileCheck,
  BookOpen,
  Server,
  FileText,
  History,
  Settings,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', href: '/', icon: Home, text: 'Dashboard' },
  { key: 'violations', href: '/violations', icon: AlertTriangle, text: 'Violations' },
  { key: 'exceptions', href: '/exceptions', icon: Shield, text: 'Exceptions' },
  { key: 'remediations', href: '/remediations', icon: FileCheck, text: 'Remediations' },
  { key: 'rules', href: '/rules', icon: BookOpen, text: 'Rules' },
  { key: 'systems', href: '/systems', icon: Server, text: 'Systems' },
  { key: 'reports', href: '/reports', icon: FileText, text: 'Reports' },
  { key: 'audit', href: '/audit', icon: History, text: 'Audit Log' },
  { key: 'settings', href: '/settings', icon: Settings, text: 'Settings' },
];
```

### 9.4 Header Customization

The header uses `#354a5f` (dark blue-gray) as the brand color. This works for enterprise apps. To change:

```typescript
<header className="h-14 bg-[#354a5f] text-white ...">
  // For a different brand color:
  // bg-[#1E3A5F] - Darker navy
  // bg-[#2D3748] - Slate gray
  // bg-[#1A202C] - Near black
```

---

## 10. File Structure Reference

```
src/
├── app/
│   ├── globals.css          # Global styles + utilities
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # Base UI components
│   │   ├── index.ts
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── label.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── skeleton.tsx
│   │   └── separator.tsx
│   └── layout/
│       └── app-shell.tsx    # Main layout shell
├── lib/
│   └── utils.ts             # Utility functions
├── tailwind.config.ts
└── postcss.config.js
```

---

## 11. Quick Reference: CSS Class Conventions

### Layout Classes
- `.kpi-grid` - 5-column responsive KPI card grid
- `.card-grid` - Auto-fit responsive card grid
- `.details-grid` - Auto-fill detail fields grid
- `.two-column-grid` - 2-column responsive grid
- `.form-row` / `.form-group` - Form layout helpers

### Component Classes
- `.stat-card` / `.stat-label` / `.stat-value` - KPI cards
- `.detail-item` / `.detail-label` / `.detail-value` - Detail fields
- `.list-item` / `.list-item-content` / `.list-item-meta` - List items
- `.section` / `.section-heading` - Section containers
- `.breadcrumb` / `.breadcrumb-link` / `.breadcrumb-current` - Navigation

### Utility Classes
- `.line-clamp-2` / `.line-clamp-3` - Text truncation
- `.monospace-id` - Monospace for IDs/codes
- `.empty-state` - Empty state container
- `.chart-container` - Chart wrapper with responsive height

---

## 12. Implementation Checklist for New Projects

```markdown
## UI/UX Implementation Checklist

### Phase 1: Foundation
- [ ] Install npm packages (CVA, clsx, tailwind-merge, lucide-react)
- [ ] Configure tailwind.config.ts with semantic colors
- [ ] Create postcss.config.js
- [ ] Create src/lib/utils.ts with cn() helper
- [ ] Create src/app/globals.css with reset and utilities

### Phase 2: Base Components
- [ ] Create src/components/ui/button.tsx
- [ ] Create src/components/ui/input.tsx
- [ ] Create src/components/ui/card.tsx
- [ ] Create src/components/ui/badge.tsx
- [ ] Create src/components/ui/alert.tsx
- [ ] Create src/components/ui/label.tsx
- [ ] Create src/components/ui/table.tsx
- [ ] Create src/components/ui/tabs.tsx
- [ ] Create src/components/ui/skeleton.tsx
- [ ] Create src/components/ui/separator.tsx
- [ ] Create src/components/ui/index.ts (exports)

### Phase 3: Layout
- [ ] Create src/components/layout/app-shell.tsx
- [ ] Customize navigation items for your app
- [ ] Customize header branding

### Phase 4: Customization
- [ ] Add domain-specific colors to Tailwind config
- [ ] Add domain-specific badge variants
- [ ] Create application-specific skeleton components
- [ ] Add any additional utility classes to globals.css

### Phase 5: Verification
- [ ] Test on mobile (< 600px)
- [ ] Test on tablet (600-900px)
- [ ] Test on desktop (> 900px)
- [ ] Verify touch targets are 44px minimum
- [ ] Verify focus states are visible
- [ ] Test with keyboard navigation
```

---

## 13. Color Reference Card

### Core Colors
| Name | Hex | Usage |
|------|-----|-------|
| `foreground` | `#0F172A` | Primary text |
| `muted` | `#64748B` | Secondary text, labels |
| `background` | `#FFFFFF` | Page background |
| `surface` | `#F8FAFC` | Card backgrounds, hover states |
| `border` | `#E2E8F0` | Borders, dividers |
| `accent` | `#3B82F6` | Primary actions, links |

### Status Colors
| Name | Hex | Usage |
|------|-----|-------|
| `success` | `#22C55E` | Success states, confirmations |
| `warning` | `#F59E0B` | Warning states, caution |
| `error` | `#EF4444` | Error states, destructive |
| `info` | `#3B82F6` | Informational messages |

### Risk Level Colors (Customize per domain)
| Name | Hex | Usage |
|------|-----|-------|
| `critical` | `#DC2626` | Critical/highest severity |
| `high` | `#EA580C` | High severity |
| `medium` | `#D97706` | Medium severity |
| `low` | `#6B7280` | Low severity/general |

---

## 14. Spacing Reference

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Button padding, small gaps |
| `space-3` | 12px | Form label gaps |
| `space-4` | 16px | Standard gaps (most common) |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large section gaps |
| `space-12` | 48px | Page sections |

---

## 15. Typography Reference

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `display` | 48px | 1.1 | 600 | Hero text |
| `h1` | 32px | 1.2 | 600 | Page titles |
| `h2` | 24px | 1.3 | 600 | Section headings |
| `h3` | 20px | 1.4 | 500 | Card titles |
| `body-lg` | 16px | 1.5 | 400 | Featured text |
| `body` | 14px | 1.5 | 400 | Default text |
| `caption` | 12px | 1.4 | 400 | Labels, timestamps |
| `overline` | 11px | 1.5 | 500 | Category labels (uppercase) |

---

## Summary

This UI/UX system provides:

1. **Consistent Design Language** - Semantic colors, typography, and spacing
2. **Accessible Components** - WCAG 2.1 compliant with 44px touch targets
3. **Responsive Layouts** - Mobile-first with breakpoints at 600px, 900px, 1280px
4. **Type-Safe Variants** - CVA pattern for component variants
5. **Minimal Dependencies** - Only essential packages
6. **Easy Customization** - Clear extension points for domain-specific needs

Apply this system to any web application for a consistent, professional, enterprise-grade user experience.
