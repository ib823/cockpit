#!/usr/bin/env node

/**
 * Phase E Setup Verification Script
 * Checks if all Phase E features are properly configured
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    checks.passed.push(`✓ ${description}`);
    return true;
  } else {
    checks.failed.push(`✗ ${description} - Missing: ${filePath}`);
    return false;
  }
}

function checkEnvVariable(varName, description) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (regex.test(envContent)) {
      const match = envContent.match(regex);
      const value = match[0].split('=')[1];
      if (value && value.trim() && value !== 'your_id_here' && value !== 'your_token_here') {
        checks.passed.push(`✓ ${description} (${varName})`);
        return true;
      } else {
        checks.warnings.push(`⚠ ${description} - Set but empty (${varName})`);
        return false;
      }
    } else {
      checks.warnings.push(`⚠ ${description} - Not set (${varName})`);
      return false;
    }
  } else {
    checks.failed.push(`✗ .env file not found`);
    return false;
  }
}

function checkDirectory(dirPath, description, requiredFiles = []) {
  const fullPath = path.join(__dirname, '..', dirPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    if (files.length === 0) {
      checks.warnings.push(`⚠ ${description} - Directory empty: ${dirPath}`);
      return false;
    }

    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (!files.includes(file)) {
        checks.warnings.push(`⚠ ${description} - Missing file: ${file}`);
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      checks.passed.push(`✓ ${description} (${files.length} files)`);
    }
    return allFilesExist;
  } else {
    checks.failed.push(`✗ ${description} - Missing: ${dirPath}`);
    return false;
  }
}

console.log('\n🔍 Verifying Phase E Setup...\n');

// Check core files
console.log('📁 Core Files:');
checkFile('public/manifest.json', 'PWA Manifest');
checkFile('public/service-worker.js', 'Service Worker');
checkFile('src/app/layout.tsx', 'Root Layout');

// Check component files
console.log('\n🧩 Components:');
checkFile('src/components/shared/HelpTooltip.tsx', 'Help Tooltip Component');
checkFile('src/components/shared/ThemeProvider.tsx', 'Theme Provider');
checkFile('src/components/shared/ThemeSettings.tsx', 'Theme Settings');
checkFile('src/components/shared/AnalyticsProvider.tsx', 'Analytics Provider');
checkFile('src/components/shared/AnalyticsSettings.tsx', 'Analytics Settings');
checkFile('src/components/shared/OfflineIndicator.tsx', 'Offline Indicator');

// Check library files
console.log('\n📚 Libraries:');
checkFile('src/lib/analytics/analytics-service.ts', 'Analytics Service');
checkFile('src/lib/analytics/use-analytics.ts', 'Analytics Hooks');
checkFile('src/lib/offline/offline-storage.ts', 'Offline Storage');
checkFile('src/lib/offline/sync-service.ts', 'Sync Service');
checkFile('src/lib/offline/use-offline.ts', 'Offline Hooks');

// Check directories
console.log('\n📂 Assets:');
checkDirectory('public/icons', 'App Icons', ['icon-192x192.png', 'icon-512x512.png']);
checkDirectory('public/screenshots', 'Screenshots', ['desktop-dashboard.png', 'mobile-estimator.png']);

// Check environment variables
console.log('\n🔐 Environment Variables:');
checkEnvVariable('NEXT_PUBLIC_HOTJAR_ID', 'Hotjar ID');
checkEnvVariable('NEXT_PUBLIC_MIXPANEL_TOKEN', 'Mixpanel Token');
checkEnvVariable('NEXT_PUBLIC_ANALYTICS_ENABLED', 'Analytics Enabled');

// Check documentation
console.log('\n📖 Documentation:');
checkFile('docs/PHASE_E_IMPLEMENTATION_SUMMARY.md', 'Implementation Summary');
checkFile('docs/PHASE_E_SETUP_GUIDE.md', 'Setup Guide');
checkFile('docs/OFFLINE_TESTING_GUIDE.md', 'Testing Guide');

// Display results
console.log('\n' + '='.repeat(60));
console.log('📊 Verification Results:\n');

if (checks.passed.length > 0) {
  console.log('✅ Passed (' + checks.passed.length + '):');
  checks.passed.forEach(check => console.log('   ' + check));
  console.log('');
}

if (checks.warnings.length > 0) {
  console.log('⚠️  Warnings (' + checks.warnings.length + '):');
  checks.warnings.forEach(check => console.log('   ' + check));
  console.log('');
}

if (checks.failed.length > 0) {
  console.log('❌ Failed (' + checks.failed.length + '):');
  checks.failed.forEach(check => console.log('   ' + check));
  console.log('');
}

console.log('='.repeat(60));

// Summary
const total = checks.passed.length + checks.warnings.length + checks.failed.length;
const score = Math.round((checks.passed.length / total) * 100);

console.log(`\n📈 Setup Completion: ${score}%`);
console.log(`   ✓ ${checks.passed.length} passed`);
console.log(`   ⚠ ${checks.warnings.length} warnings`);
console.log(`   ✗ ${checks.failed.length} failed`);

if (score === 100) {
  console.log('\n🎉 Perfect! All Phase E features are properly configured.\n');
} else if (score >= 80) {
  console.log('\n✅ Good! Most features are configured. Review warnings above.\n');
} else if (score >= 60) {
  console.log('\n⚠️  Partial setup. Some features need configuration.\n');
} else {
  console.log('\n❌ Setup incomplete. Please review failed checks above.\n');
}

// Next steps
if (checks.warnings.length > 0 || checks.failed.length > 0) {
  console.log('📝 Next Steps:\n');

  if (checks.warnings.some(w => w.includes('Hotjar') || w.includes('Mixpanel') || w.includes('Analytics'))) {
    console.log('   1. Configure analytics in .env file:');
    console.log('      NEXT_PUBLIC_HOTJAR_ID=your_id');
    console.log('      NEXT_PUBLIC_MIXPANEL_TOKEN=your_token');
    console.log('      NEXT_PUBLIC_ANALYTICS_ENABLED=true\n');
  }

  if (checks.warnings.some(w => w.includes('Icons')) || checks.warnings.some(w => w.includes('Screenshots'))) {
    console.log('   2. Generate PWA assets:');
    console.log('      npm run pwa:setup\n');
  }

  if (checks.failed.length > 0) {
    console.log('   3. Review missing files and run setup again.\n');
  }

  console.log('   See docs/PHASE_E_SETUP_GUIDE.md for detailed instructions.\n');
}

// Exit code
process.exit(checks.failed.length > 0 ? 1 : 0);
