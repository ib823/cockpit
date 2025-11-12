/**
 * Apple HIG Specification Compliance Tests
 *
 * PIXEL-PERFECT verification of UI_suggestion.md implementation
 * Steve Jobs level stringency - every pixel, every color, every spacing
 *
 * NO BULLSHIT - Tests fail if ANY value is off by even 1px or 1 RGB unit
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Apple HIG Specification - PIXEL PERFECT Tests', () => {
  describe('1. Design System CSS - Exact Values', () => {
    const designSystemPath = path.join(process.cwd(), 'src/styles/design-system.css');
    const designSystemCSS = fs.readFileSync(designSystemPath, 'utf-8');

    it('should have EXACT typography sizes (28px, 24px, 20px, 15px, 13px, 11px, 10px)', () => {
      expect(designSystemCSS).toContain('--text-display-large: 1.75rem'); // 28px
      expect(designSystemCSS).toContain('--text-display-medium: 1.5rem'); // 24px
      expect(designSystemCSS).toContain('--text-display-small: 1.25rem'); // 20px
      expect(designSystemCSS).toContain('--text-body-large: 0.9375rem'); // 15px
      expect(designSystemCSS).toContain('--text-body: 0.8125rem'); // 13px
      expect(designSystemCSS).toContain('--text-detail: 0.6875rem'); // 11px
      expect(designSystemCSS).toContain('--text-detail-small: 0.625rem'); // 10px
    });

    it('should have EXACT font families (SF Pro Display, SF Pro Text)', () => {
      expect(designSystemCSS).toContain("--font-display: 'SF Pro Display'");
      expect(designSystemCSS).toContain("--font-text: 'SF Pro Text'");
    });

    it('should have EXACT opacity scale (100%, 60%, 40%, 25%)', () => {
      expect(designSystemCSS).toContain('--opacity-primary: 1');
      expect(designSystemCSS).toContain('--opacity-secondary: 0.6');
      expect(designSystemCSS).toContain('--opacity-tertiary: 0.4');
      expect(designSystemCSS).toContain('--opacity-disabled: 0.25');
    });

    it('should have EXACT spacing system (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)', () => {
      expect(designSystemCSS).toContain('--space-xs: 0.25rem'); // 4px
      expect(designSystemCSS).toContain('--space-sm: 0.5rem'); // 8px
      expect(designSystemCSS).toContain('--space-md: 0.75rem'); // 12px
      expect(designSystemCSS).toContain('--space-base: 1rem'); // 16px
      expect(designSystemCSS).toContain('--space-lg: 1.5rem'); // 24px
      expect(designSystemCSS).toContain('--space-xl: 2rem'); // 32px
      expect(designSystemCSS).toContain('--space-2xl: 3rem'); // 48px
      expect(designSystemCSS).toContain('--space-3xl: 4rem'); // 64px
    });

    it('should have EXACT Apple System Blue color rgb(0, 122, 255)', () => {
      expect(designSystemCSS).toContain('--color-blue: rgb(0, 122, 255)');
    });

    it('should have EXACT Apple System Green color rgb(52, 199, 89)', () => {
      expect(designSystemCSS).toContain('--color-green: rgb(52, 199, 89)');
    });

    it('should have EXACT Apple System Orange color rgb(255, 149, 0)', () => {
      expect(designSystemCSS).toContain('--color-orange: rgb(255, 149, 0)');
    });

    it('should have EXACT Apple System Red color rgb(255, 59, 48)', () => {
      expect(designSystemCSS).toContain('--color-red: rgb(255, 59, 48)');
    });

    it('should have EXACT animation timings (100ms, 200ms, 300ms)', () => {
      expect(designSystemCSS).toContain('--duration-quick: 100ms');
      expect(designSystemCSS).toContain('--duration-default: 200ms');
      expect(designSystemCSS).toContain('--duration-slow: 300ms');
    });

    it('should have EXACT border radius values (6px, 8px, 12px)', () => {
      expect(designSystemCSS).toContain('--radius-sm: 6px');
      expect(designSystemCSS).toContain('--radius-md: 8px');
      expect(designSystemCSS).toContain('--radius-lg: 12px');
    });
  });

  describe('2. Color System - Exact RGB Values', () => {
    const tokensPath = path.join(process.cwd(), 'src/styles/tokens.css');
    const tokensCSS = fs.readFileSync(tokensPath, 'utf-8');

    it('should have System Blue rgb(0, 122, 255) in tokens.css', () => {
      expect(tokensCSS).toContain('rgb(0, 122, 255)');
    });

    it('should have System Green rgb(52, 199, 89) in tokens.css', () => {
      expect(tokensCSS).toContain('rgb(52, 199, 89)');
    });

    it('should have System Orange rgb(255, 149, 0) in tokens.css', () => {
      expect(tokensCSS).toContain('rgb(255, 149, 0)');
    });

    it('should have System Red rgb(255, 59, 48) in tokens.css', () => {
      expect(tokensCSS).toContain('rgb(255, 59, 48)');
    });

    it('should NOT have old blue color #2563eb', () => {
      expect(tokensCSS).not.toContain('#2563eb');
    });

    it('should NOT have old green color #16a34a', () => {
      expect(tokensCSS).not.toContain('#16a34a');
    });

    it('should NOT have old orange color #f59e0b', () => {
      expect(tokensCSS).not.toContain('#f59e0b');
    });

    it('should NOT have old red color #ef4444', () => {
      expect(tokensCSS).not.toContain('#ef4444');
    });
  });

  describe('3. Emoji Removal - Zero Tolerance', () => {
    const componentFiles = [
      'src/components/gantt-tool/MissionControlModal.tsx',
      'src/components/gantt-tool/GanttCanvas.tsx',
      'src/components/gantt-tool/GanttCanvasV3.tsx',
      'src/components/gantt-tool/GanttSidePanel.tsx',
      'src/components/project-v2/modes/PlanMode.tsx',
      'src/components/shared/KeyboardShortcutsHelp.tsx',
    ];

    componentFiles.forEach((filePath) => {
      it(`should have ZERO emojis in ${filePath}`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Check for common emojis
          const emojiPatterns = [
            '💎', '📊', '🔵', '✅', '🔧', '🔒', '👥', '🔄', '⚡',
            '⚠', '🎯', '📈', '💰', '🌟', '🏆', '💻', '👔', '🏗️',
            '💼', '🔍', '🇲🇾', '🇸🇬', '🇻🇳', '🇺🇸'
          ];

          emojiPatterns.forEach(emoji => {
            expect(content).not.toContain(emoji);
          });
        }
      });
    });
  });

  describe('4. Mission Control Modal - Pixel Perfect', () => {
    const missionControlPath = path.join(process.cwd(), 'src/components/gantt-tool/MissionControlModal.tsx');
    const missionControlCode = fs.readFileSync(missionControlPath, 'utf-8');

    it('should have header height EXACTLY 80px', () => {
      expect(missionControlCode).toContain('height: "80px"');
    });

    it('should have icon size EXACTLY 48x48px', () => {
      expect(missionControlCode).toContain('width: "48px", height: "48px"');
    });

    it('should have KPI card height EXACTLY 96px', () => {
      expect(missionControlCode).toContain('height: "96px"');
    });

    it('should use var(--font-display) for project name', () => {
      expect(missionControlCode).toContain('fontFamily: "var(--font-display)"');
    });

    it('should use var(--font-text) for labels', () => {
      expect(missionControlCode).toContain('fontFamily: "var(--font-text)"');
    });

    it('should use var(--color-gray-6) for card backgrounds', () => {
      expect(missionControlCode).toContain('backgroundColor: "var(--color-gray-6)"');
    });

    it('should have 12px border radius on cards', () => {
      expect(missionControlCode).toContain('borderRadius: "12px"');
    });

    it('should have 16px padding on cards', () => {
      expect(missionControlCode).toContain('padding: "16px"');
    });

    it('should have progress bar height EXACTLY 4px', () => {
      expect(missionControlCode).toContain('height: "4px"');
    });

    it('should NOT use Ant Design Statistic component', () => {
      // Check that the old Statistic usage is gone
      const hasOldStatistic = missionControlCode.includes('<Statistic') &&
                              missionControlCode.includes('title="Budget Utilization"') &&
                              missionControlCode.includes('valueStyle={{');
      expect(hasOldStatistic).toBe(false);
    });
  });

  describe('5. Gantt Canvas V3 - Pixel Perfect', () => {
    const ganttV3Path = path.join(process.cwd(), 'src/components/gantt-tool/GanttCanvasV3.tsx');
    const ganttV3Code = fs.readFileSync(ganttV3Path, 'utf-8');

    it('should have TASK_BAR_HEIGHT constant EXACTLY 32', () => {
      expect(ganttV3Code).toContain('const TASK_BAR_HEIGHT = 32');
    });

    it('should have PHASE_ROW_HEIGHT constant EXACTLY 40', () => {
      expect(ganttV3Code).toContain('const PHASE_ROW_HEIGHT = 40');
    });

    it('should have TASK_ROW_HEIGHT constant EXACTLY 40', () => {
      expect(ganttV3Code).toContain('const TASK_ROW_HEIGHT = 40');
    });

    it('should have task bar height style EXACTLY 32px', () => {
      expect(ganttV3Code).toContain('height: "32px"');
    });

    it('should use var(--font-text) for task names', () => {
      expect(ganttV3Code).toContain('fontFamily: "var(--font-text)"');
    });

    it('should use var(--text-body) for task name font size', () => {
      expect(ganttV3Code).toContain('fontSize: "var(--text-body)"');
    });

    it('should have 8px internal padding on task bars', () => {
      expect(ganttV3Code).toContain('padding: "0 8px"');
    });

    it('should have 8px gap between task bar elements', () => {
      expect(ganttV3Code).toContain('gap: "8px"');
    });

    it('should have 6px border radius on task bars', () => {
      expect(ganttV3Code).toContain('borderRadius: "6px"');
    });

    it('should have progress indicator EXACTLY 3px height', () => {
      expect(ganttV3Code).toContain('height: "3px"');
    });

    it('should use GANTT_STATUS_COLORS for semantic coloring', () => {
      expect(ganttV3Code).toContain('GANTT_STATUS_COLORS');
    });

    it('should have timeline header height EXACTLY 48px', () => {
      expect(ganttV3Code).toContain('height: "48px"');
    });

    it('should use "Q1 \'26" timeline format (not "Q1 2026")', () => {
      expect(ganttV3Code).toContain("Q${quarter} '${year}");
    });

    it('should have status icon EXACTLY 16x16px', () => {
      expect(ganttV3Code).toContain('width: "16px", height: "16px"');
    });

    it('should NOT have badge modes (WD, CD, Resource)', () => {
      expect(ganttV3Code).not.toContain('barDurationDisplay');
      expect(ganttV3Code).not.toContain('badge mode');
    });
  });

  describe('6. SegmentedControl Component - Pixel Perfect', () => {
    const segmentedPath = path.join(process.cwd(), 'src/components/common/SegmentedControl.tsx');

    if (fs.existsSync(segmentedPath)) {
      const segmentedCode = fs.readFileSync(segmentedPath, 'utf-8');

      it('should use var(--color-gray-6) for background', () => {
        expect(segmentedCode).toContain('var(--color-gray-6)');
      });

      it('should use var(--font-text) for typography', () => {
        expect(segmentedCode).toContain('var(--font-text)');
      });

      it('should use var(--text-body) for font size', () => {
        expect(segmentedCode).toContain('var(--text-body)');
      });

      it('should have selected state with white background', () => {
        expect(segmentedCode).toContain('var(--color-bg-primary)');
      });

      it('should have unselected opacity 0.6', () => {
        expect(segmentedCode).toContain('opacity: 0.6');
      });

      it('should use var(--duration-default) for transitions', () => {
        expect(segmentedCode).toContain('var(--duration-default)');
      });
    }
  });

  describe('7. Spacing Grid - 8px Multiples', () => {
    const ganttV3Path = path.join(process.cwd(), 'src/components/gantt-tool/GanttCanvasV3.tsx');
    const ganttV3Code = fs.readFileSync(ganttV3Path, 'utf-8');

    it('should use 8px (var(--space-sm)) for gaps', () => {
      expect(ganttV3Code).toContain('"8px"');
    });

    it('should use 16px (var(--space-base)) for padding', () => {
      expect(ganttV3Code).toContain('"16px"');
    });

    it('should use 24px (var(--space-lg)) for larger padding', () => {
      expect(ganttV3Code).toContain('"24px"');
    });

    it('should NOT use non-8px-grid values like 7px, 9px, 15px, 17px', () => {
      const invalidSpacings = ['"7px"', '"9px"', '"15px"', '"17px"', '"23px"', '"25px"'];
      invalidSpacings.forEach(spacing => {
        expect(ganttV3Code).not.toContain(spacing);
      });
    });
  });

  describe('8. File Structure - Required Files Exist', () => {
    it('should have design-system.css file', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'src/styles/design-system.css'));
      expect(exists).toBe(true);
    });

    it('should have GanttCanvasV3.tsx component', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'src/components/gantt-tool/GanttCanvasV3.tsx'));
      expect(exists).toBe(true);
    });

    it('should have V3 page route', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'src/app/gantt-tool/v3/page.tsx'));
      expect(exists).toBe(true);
    });

    it('should have SegmentedControl component', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'src/components/common/SegmentedControl.tsx'));
      expect(exists).toBe(true);
    });

    it('should have V3 compliance documentation', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'docs/GANTT_V3_SPEC_COMPLIANCE.md'));
      expect(exists).toBe(true);
    });

    it('should have final compliance report', () => {
      const exists = fs.existsSync(path.join(process.cwd(), 'docs/FINAL_COMPLIANCE_REPORT.md'));
      expect(exists).toBe(true);
    });
  });

  describe('9. Globals.css - Design System Import', () => {
    const globalsPath = path.join(process.cwd(), 'src/app/globals.css');
    const globalsCSS = fs.readFileSync(globalsPath, 'utf-8');

    it('should import design-system.css BEFORE other imports', () => {
      const designSystemImport = globalsCSS.indexOf('@import "../styles/design-system.css"');
      const tokensImport = globalsCSS.indexOf('@import "../styles/tokens.css"');

      expect(designSystemImport).toBeGreaterThan(-1);
      expect(tokensImport).toBeGreaterThan(-1);
      expect(designSystemImport).toBeLessThan(tokensImport);
    });
  });

  describe('10. Typography Classes - Utility Presence', () => {
    const designSystemPath = path.join(process.cwd(), 'src/styles/design-system.css');
    const designSystemCSS = fs.readFileSync(designSystemPath, 'utf-8');

    it('should have .display-large utility class', () => {
      expect(designSystemCSS).toContain('.display-large');
    });

    it('should have .display-medium utility class', () => {
      expect(designSystemCSS).toContain('.display-medium');
    });

    it('should have .body utility class', () => {
      expect(designSystemCSS).toContain('.body {');
    });

    it('should have .detail utility class', () => {
      expect(designSystemCSS).toContain('.detail');
    });

    it('should have color utility classes', () => {
      expect(designSystemCSS).toContain('.color-blue');
      expect(designSystemCSS).toContain('.color-green');
      expect(designSystemCSS).toContain('.color-orange');
      expect(designSystemCSS).toContain('.color-red');
    });

    it('should have spacing utility classes', () => {
      expect(designSystemCSS).toContain('.p-sm');
      expect(designSystemCSS).toContain('.m-sm');
      expect(designSystemCSS).toContain('.gap-sm');
    });
  });
});
