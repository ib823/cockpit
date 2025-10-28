# Keystone - Development Documentation

## Project Overview

A sophisticated SAP implementation planning tool built with Next.js 15, TypeScript, and React. Features timeline visualization, resource management, and comprehensive project planning capabilities.

## Current State (As of this session)

- **Branch**: refactor/extract-timeline
- **Framework**: Next.js 15.5.3 with Turbopack
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **Key Libraries**: react-dnd, react-dnd-html5-backend

## File Structure

src/
├── app/
│ ├── page.tsx (Landing page)
│ ├── timeline/
│ │ └── page.tsx (Main timeline interface)
│ └── layout.tsx (Root layout with hydration fix)
├── components/
│ └── timeline/
│ ├── GanttChart.tsx (Main timeline visualization)
│ └── TimelineControls.tsx (Project metrics display)
├── lib/
│ └── timeline/
│ ├── date-calculations.ts (Business day calculations)
│ └── phase-generator.ts (Phase creation logic)
├── stores/
│ └── timeline-store.ts (Zustand store with persistence)
├── data/
│ ├── sap-catalog.ts (SAP package definitions)
│ └── resource-catalog.ts (Resource rates and costs)
└── types/
└── core.ts (TypeScript definitions)

## Implemented Features

### 1. Timeline Visualization

- Gantt chart with calendar axis showing dates
- Drag-and-drop phase reordering
- Visual distinction for weekends and holidays
- Phase bars with duration display

### 2. Resource Management

- Add/remove team members per phase
- Allocation percentage control (0-150%)
- Resource avatars on phase bars (max 3, then +X)
- Utilization visualization bar (green/orange/red)
- Resource dashboard with metrics:
  - Total members
  - Average load
  - Over-allocated count
  - Under-utilized count

### 3. Holiday Management

- Add/remove holidays with date picker
- Visual highlighting on calendar
- Intended to extend phase duration (partially implemented)

### 4. Cost Calculation

- Per-resource hourly rates
- Total project cost calculation
- Region-specific currency formatting
- Presentation mode to hide costs

### 5. UI/UX Design

- Minimalist interface following Steve Jobs principles
- No emojis in professional interface
- Clean typography with light font weights
- Subtle hover states and transitions
- 3-color phase customization (blue/green/purple)

## Known Issues and Bugs

### Critical Issues

1. **Date Display Bug**: Shows "NaN-undefined-aN (undefined)" instead of proper dates
   - Root cause: Date calculation returning invalid values
   - Location: TimelineControls.tsx and GanttChart.tsx

2. **Phase Color Persistence**: Color changes don't persist after modal close
   - Store updates but UI doesn't reflect changes
   - Might need force re-render

3. **Holiday Duration Extension**: Not working as intended
   - Phases should extend when holidays fall within them
   - Logic exists but not properly integrated

### Minor Issues

1. Resource avatars might not show immediately after adding
2. Utilization bar calculation needs verification
3. Some phase dependencies not properly handled

## Key Decisions and Lessons Learned

### Architecture Decisions

1. **Zustand over Context**: Better performance for frequent updates
2. **Modular Components**: Separate concerns for maintainability
3. **Business Day Calculations**: Custom implementation for flexibility
4. **Persistent Storage**: Local storage for user preferences

### UI/UX Decisions

1. **No Emojis**: Professional enterprise software aesthetic
2. **Minimal Colors**: Gray scale with selective blue accents
3. **Inline Actions**: Click phases directly for resources
4. **Dashboard Integration**: Metrics in same modal as management

### Technical Lessons

1. **Hydration Issues**: Browser extensions can cause React hydration mismatches
   - Solution: suppressHydrationWarning on body tag
2. **File Updates in Dev**: Sometimes need to clear .next cache
3. **NaN Propagation**: Always validate calculations with fallbacks
4. **State Persistence**: Zustand middleware handles complex nested state

## Configuration and Setup

### Environment

- Node.js runtime in GitHub Codespaces
- Port 3000 for development server
- Turbopack for faster builds

### Key Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
rm -rf .next         # Clear cache if needed
Implementation Details
Phase Generation Algorithm

5 standard phases per SAP package: Prepare (15%), Explore (25%), Realize (40%), Deploy (15%), Run (5%)
Complexity multipliers: Simple (0.8x), Standard (1.0x), Complex (1.3x), Very Complex (1.6x)
Sequential dependencies within package phases

Resource Cost Calculation
typescriptdailyRate = hourlyRate * 8
phaseCost = dailyRate * workingDays * (allocation / 100)
totalCost = sum of all phase costs
Business Day Calculations

Skips weekends (Saturday/Sunday)
Accounts for configured holidays
Base date: January 1, 2024

Next Steps for Development
Immediate Fixes Needed

Fix date display showing NaN
Persist phase color changes
Implement proper holiday extension logic
Add validation for all calculations

Feature Enhancements

Export timeline to PDF/Excel
Resource conflict detection
Critical path highlighting
Budget alerts and thresholds
Multiple timeline scenarios
Integration with external calendars

Code Quality Improvements

Add comprehensive error boundaries
Implement proper loading states
Add unit tests for calculations
Optimize re-renders with React.memo
Add accessibility features (ARIA labels)

Important Notes

Always run in Codespaces environment
Use simple terminal commands, no shell scripts
Test all date calculations with edge cases
Maintain minimalist design principles
Keep professional tone without emojis
```
