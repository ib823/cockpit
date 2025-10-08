#!/bin/bash

# Claude.ai Project Knowledge Sync Script
# This script creates a clean copy of the codebase for Claude.ai assessment
# Following the exact structure and exclusions defined in CLAUDE_AI_SYNC_STRATEGY.md

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Output directory
OUTPUT_DIR="claude-project-knowledge"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="claude-assessment-${TIMESTAMP}.zip"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Claude.ai Project Knowledge Sync${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Clean previous output
if [ -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}Cleaning previous output...${NC}"
    rm -rf "$OUTPUT_DIR"
fi

echo -e "${GREEN}Creating directory structure...${NC}\n"
mkdir -p "$OUTPUT_DIR"

# Function to copy with exclusions
copy_with_structure() {
    local source=$1
    local dest=$2

    if [ -f "$source" ]; then
        mkdir -p "$(dirname "$dest")"
        cp "$source" "$dest"
        echo "  ✓ $(basename "$source")"
    elif [ -d "$source" ]; then
        echo -e "${BLUE}📁 $(basename "$source")${NC}"
        cp -r "$source" "$dest"
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. GitHub Workflows
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[1/11] GitHub Configuration${NC}"
if [ -d ".github" ]; then
    copy_with_structure ".github" "$OUTPUT_DIR/.github"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Project Knowledge
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[2/11] Project Knowledge${NC}"
if [ -d ".project-knowledge" ]; then
    copy_with_structure ".project-knowledge" "$OUTPUT_DIR/.project-knowledge"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Documentation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[3/11] Documentation${NC}"
if [ -d "docs" ]; then
    copy_with_structure "docs" "$OUTPUT_DIR/docs"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Lib
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[4/11] Library Files${NC}"
if [ -d "lib" ]; then
    copy_with_structure "lib" "$OUTPUT_DIR/lib"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. Prisma (Database Schema)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[5/11] Database Schema (Prisma)${NC}"
if [ -d "prisma" ]; then
    mkdir -p "$OUTPUT_DIR/prisma"
    [ -f "prisma/schema.prisma" ] && copy_with_structure "prisma/schema.prisma" "$OUTPUT_DIR/prisma/schema.prisma"
    [ -f "prisma/_passkey_models.prisma" ] && copy_with_structure "prisma/_passkey_models.prisma" "$OUTPUT_DIR/prisma/_passkey_models.prisma"
    [ -f "prisma/seed.ts" ] && copy_with_structure "prisma/seed.ts" "$OUTPUT_DIR/prisma/seed.ts"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. Public Assets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[6/11] Public Assets${NC}"
if [ -d "public" ]; then
    copy_with_structure "public" "$OUTPUT_DIR/public"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. Scripts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[7/11] Scripts${NC}"
if [ -d "scripts" ]; then
    copy_with_structure "scripts" "$OUTPUT_DIR/scripts"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. Source Code (MOST CRITICAL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[8/11] Source Code (src/)${NC}"
if [ -d "src" ]; then
    copy_with_structure "src" "$OUTPUT_DIR/src"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 9. Tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[9/11] Tests${NC}"
if [ -d "tests" ]; then
    copy_with_structure "tests" "$OUTPUT_DIR/tests"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 10. Root Configuration Files
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[10/11] Configuration Files${NC}"
config_files=(
    ".env.example"
    ".eslintrc.js"
    ".eslintrc.json"
    ".prettierrc.json"
    ".gitignore"
    "jest.config.js"
    "jest.setup.js"
    "next.config.js"
    "package.json"
    "pnpm-lock.yaml"
    "postcss.config.js"
    "tailwind.config.js"
    "tsconfig.json"
    "vitest.config.ts"
    "vercel.json"
)

for file in "${config_files[@]}"; do
    [ -f "$file" ] && copy_with_structure "$file" "$OUTPUT_DIR/$file"
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 11. Root Documentation (Selective)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${GREEN}[11/11] Root Documentation${NC}"
doc_files=(
    "README.md"
    "COMPREHENSIVE_SOLUTION_OVERVIEW.md"
    "CODEBASE_OVERVIEW.md"
    "CLAUDE_AI_UPLOAD_GUIDE.md"
    "CLAUDE_AI_SYNC_STRATEGY.md"
    "DEVELOPER_GUIDE.md"
    "SECURITY.md"
    "SECURITY_CONTROLS.md"
    "DEPLOYMENT_GUIDE.md"
    "ACCESSIBILITY_COMPLIANCE.md"
    "AUTHENTICATION.md"
    "BRANDING_GUIDE.md"
    "ADMIN_DASHBOARD_GUIDE.md"
    "ACCESS_CODE_FLOW.txt"
)

for file in "${doc_files[@]}"; do
    [ -f "$file" ] && copy_with_structure "$file" "$OUTPUT_DIR/$file"
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Create Archive
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Creating archive...${NC}"

cd "$OUTPUT_DIR"
zip -r "../$ARCHIVE_NAME" . -q
cd ..

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Statistics
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Sync Complete!${NC}\n"

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
FOLDER_COUNT=$(find "$OUTPUT_DIR" -type d | wc -l)
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

echo -e "📊 ${BLUE}Statistics:${NC}"
echo -e "   Files:   ${GREEN}$FILE_COUNT${NC}"
echo -e "   Folders: ${GREEN}$FOLDER_COUNT${NC}"
echo -e "   Archive: ${GREEN}$ARCHIVE_SIZE${NC}"

echo -e "\n📦 ${BLUE}Output:${NC}"
echo -e "   Directory: ${YELLOW}$OUTPUT_DIR/${NC}"
echo -e "   Archive:   ${YELLOW}$ARCHIVE_NAME${NC}"

echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "   1. Upload ${YELLOW}$ARCHIVE_NAME${NC} to Claude.ai Project Knowledge"
echo -e "   2. Or drag & drop the ${YELLOW}$OUTPUT_DIR/${NC} folder contents"
echo -e "   3. Use CLAUDE_AI_SYNC_STRATEGY.md for reference"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
