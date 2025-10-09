# Abidbn Reference Guide

## For Abidbn: Use This Toolkit

When building pages for SAP Cockpit, ALWAYS reference this UI toolkit.

## Import Pattern
```tsx
// Standard imports
import { Container, Section, Header, Footer } from '@/components';
import { StatCard, Card, Badge } from '@/components';
import { Modal, Alert, Loading } from '@/components';
import { GanttChart, ChatMessage } from '@/components';
import { DESIGN_TOKENS, useResponsive } from '@/lib';
Component Locations

Layout: /src/components/layout/
Feedback: /src/components/feedback/
Data Display: /src/components/data-display/
Forms: /src/components/forms/
Domain: /src/components/domain/
Utils: /src/lib/

Design Tokens Location
/src/lib/design-tokens.ts - Use these constants for:

Colors
Spacing
Typography
Shadows
Border radius
Transitions

Standards

Always use design tokens - Don't hardcode values
Mobile-first - Build for mobile, scale up
Consistent spacing - Use multiples of 4px
Accessible - Include proper ARIA labels
Type-safe - Use TypeScript interfaces

Example Page Structure
tsx<Header sticky />
<Section variant="gradient" padding="xl">
  <Container size="xl">
    {/* Content */}
  </Container>
</Section>
<Footer />
Quick Commands
View components: ls src/components/*/
Check design tokens: cat src/lib/design-tokens.ts
See examples: cat docs/ui-toolkit/USAGE_EXAMPLES.md

---

## **STEP 7: INSTALL DEPENDENCIES**
```bash
# Install all required packages
npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge canvas-confetti

# Install dev dependencies
npm install -D @types/canvas-confetti

# Initialize shadcn/ui (if not done)
npx shadcn-ui@latest init

# Add shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add label
