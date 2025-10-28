# Claude.ai Sync - Quick Usage Guide

## 🚀 Quick Start

```bash
# Run the sync script
./sync-with-claude.sh
```

This will:
1. Create a `claude-project-knowledge/` directory with all assessment-ready files
2. Generate a timestamped `.zip` archive (e.g., `claude-assessment-20251008_143022.zip`)
3. Show statistics about included files

## 📋 What Gets Synced

The script follows the **exact VS Code Explorer order** and includes:

### Critical Folders (Full Content)
- ✅ `.github/` - CI/CD workflows
- ✅ `src/` - **All source code** (most important)
- ✅ `tests/` - All test files
- ✅ `prisma/` - Database schema
- ✅ `docs/` - Documentation
- ✅ `scripts/` - Automation scripts
- ✅ `lib/` - Session/auth logic
- ✅ `public/` - Assets

### Configuration Files
- ✅ `package.json`, `tsconfig.json`, `next.config.js`, etc.
- ✅ `.env.example` (template only, no secrets)
- ✅ All config files (`.eslintrc`, `.prettierrc`, `tailwind.config.js`, etc.)

### Key Documentation
- ✅ `README.md`
- ✅ `CODEBASE_OVERVIEW.md`
- ✅ `SECURITY*.md`
- ✅ `DEVELOPER_GUIDE.md`
- ✅ Other core docs (see list in `CLAUDE_AI_SYNC_STRATEGY.md`)

## 🚫 What's Excluded

### Security (Never Included)
- ❌ `.env` - Contains secrets
- ❌ `.env.local` - Contains secrets
- ❌ Any `.env*.local` files

### Build Artifacts
- ❌ `.next/` - Build output
- ❌ `node_modules/` - Dependencies
- ❌ `*.tsbuildinfo` - Build cache

### IDE & Tooling
- ❌ `.claude/`, `.vscode/`, `.vercel/`
- ❌ `.git/` - Version control

### Redundant Reports
- ❌ `*_COMPLETE.md`, `*_STATUS.md`, `*_REPORT.md`
- ❌ `SESSION_*.md`, `*_IMPLEMENTATION*.md`
- ❌ Debug folders (`gptdebug/`, `env_report_*/`)
- ❌ Archive files (`*.zip`, `*.log`)

## 📊 Expected Output

```
📊 Statistics:
   Files:   ~500-800
   Folders: ~50-100
   Archive: ~5-15 MB

📦 Output:
   Directory: claude-project-knowledge/
   Archive:   claude-assessment-20251008_143022.zip
```

## 🎯 Upload to Claude.ai

### Option 1: Upload Archive (Recommended)
1. Go to your Claude.ai Project
2. Open Project Knowledge settings
3. Click "Add Files"
4. Upload `claude-assessment-YYYYMMDD_HHMMSS.zip`
5. Claude will automatically extract and index all files

### Option 2: Drag & Drop Folder
1. Go to your Claude.ai Project
2. Open the `claude-project-knowledge/` folder in your file explorer
3. Select all contents (Ctrl+A / Cmd+A)
4. Drag and drop into Claude.ai Project Knowledge

## 🔍 Verification

After upload, verify these key files are present in Claude.ai:

```
✓ src/app/          - Next.js app router
✓ src/components/   - React components
✓ src/lib/          - Core logic
✓ src/types/        - TypeScript types
✓ prisma/schema.prisma - Database schema
✓ package.json      - Dependencies
✓ README.md         - Project overview
```

## 🔄 Re-sync After Changes

When you make significant code changes:

```bash
# Re-run the script (previous archives are kept with timestamps)
./sync-with-claude.sh

# Upload the new archive to Claude.ai (replace previous knowledge)
```

## 📝 Assessment Prompts

After uploading, use these prompts in Claude.ai for comprehensive assessment:

### Security Assessment
```
Review this codebase for security vulnerabilities, focusing on:
- Authentication and authorization flows
- Input validation and sanitization
- Database queries and schema design
- API security (rate limiting, CORS, etc.)
- Environment variable handling
- Session management
Provide specific file locations and severity ratings.
```

### UX Assessment
```
Analyze the user experience across this application:
- Component design patterns and consistency
- Accessibility compliance (WCAG standards)
- User flows and navigation
- Form validation and error handling
- Loading states and feedback
- Mobile responsiveness
Suggest specific improvements with file references.
```

### Architecture Assessment
```
Evaluate the codebase architecture:
- Code organization and structure
- Type safety and TypeScript usage
- State management patterns
- API design and data flow
- Testing coverage and quality
- Dependencies and technical debt
Identify areas for refactoring or improvement.
```

### Flow Assessment
```
Map out the critical business flows:
- User authentication journey
- Admin access code delivery
- Presales estimation workflow
- Timeline and milestone management
Identify any logic gaps or edge cases.
```

## 🛠️ Customization

To modify what gets synced, edit `sync-with-claude.sh`:

```bash
# Add more files
doc_files=(
    "README.md"
    "YOUR_NEW_FILE.md"  # Add here
)

# Add more folders
copy_with_structure "your-folder" "$OUTPUT_DIR/your-folder"
```

## 📚 Reference

- **Strategy Document:** `CLAUDE_AI_SYNC_STRATEGY.md`
- **Upload Guide:** `CLAUDE_AI_UPLOAD_GUIDE.md`
- **Project Overview:** `CODEBASE_OVERVIEW.md`

## ⚡ Tips

1. **Run after major changes** - Keep Claude.ai in sync with your latest code
2. **Review before upload** - Check `claude-project-knowledge/` contents
3. **Use timestamps** - Archives are timestamped, so you can track versions
4. **Clean up old archives** - Delete old `.zip` files when no longer needed
5. **Never commit .env** - The script specifically excludes secrets for safety

## 🐛 Troubleshooting

### "Permission denied"
```bash
chmod +x sync-with-claude.sh
./sync-with-claude.sh
```

### "Command not found: zip"
```bash
# Install zip utility
sudo apt-get install zip  # Debian/Ubuntu
brew install zip          # macOS
```

### Archive too large for Claude.ai
The script is designed to stay under Claude.ai's limits (~100MB), but if needed:
- Check for accidentally included large files
- Verify `node_modules/` and `.next/` are excluded
- Review the strategy document for additional exclusions

---

**Last Updated:** 2025-10-08
**Maintains VS Code Explorer Order:** ✅
**Security Safe:** ✅ (no secrets included)
**Assessment Ready:** ✅
