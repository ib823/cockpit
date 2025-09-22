# SAP Presales Engine - Current State

## Quick Start

1. Run: `pnpm dev`
2. Navigate to: http://localhost:3000/presales
3. Paste RFP text to extract chips
4. Use Import/Export buttons for state management

## Architecture

- **Parser**: Extracts structured data from text (src/lib/chip-parser.ts)
- **Store**: Zustand with persistence (src/stores/presales-store.ts)
- **UI**: Next.js 15 with TypeScript and Tailwind

## Key Features

- 10 chip types with confidence scoring
- Auto-workflow progression
- Secure JSON import/export (no files)
- Complete metrics tracking

## Next Steps

1. Build Decision components (module selection, pricing)
2. Create Planning canvas with timeline visualization
3. Implement Review and Present modes
4. Add baseline scenario generation from chips
