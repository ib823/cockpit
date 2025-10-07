#!/bin/bash

echo "🚀 Setting up UI Toolkit..."

# Create directories
mkdir -p docs/ui-toolkit
mkdir -p src/components/{layout,feedback,data-display,forms,domain}
mkdir -p src/lib

# Create all component files
touch src/components/layout/{Container,Section,Header,Footer,index}.tsx
touch src/components/feedback/{Modal,Alert,Loading,EmptyState,Toast,index}.tsx
touch src/components/data-display/{Card,StatCard,Badge,Progress,index}.tsx
touch src/components/forms/{FormField,Select,Checkbox,Radio,FileUpload,index}.tsx
touch src/components/domain/{GanttChart,PhaseCard,DecisionCard,ChatMessage,CelebrationModal,index}.tsx

# Create lib files
touch src/lib/{design-tokens,responsive,utils,index}.ts

# Create documentation
touch docs/ui-toolkit/{README,COMPONENTS,DESIGN_SYSTEM,USAGE_EXAMPLES,CLAUDE_CODE_REFERENCE}.md

# Create master index
touch src/components/index.ts

echo "✅ UI Toolkit structure created!"
echo "📝 Next steps:"
echo "   1. Copy component code into files"
echo "   2. Run: npm install framer-motion lucide-react canvas-confetti"
echo "   3. Run: npx shadcn-ui@latest init"
echo "   4. Check docs/ui-toolkit/README.md"