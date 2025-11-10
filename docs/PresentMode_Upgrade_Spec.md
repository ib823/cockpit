# PresentMode Upgrade Specification

**Source:** UX_UI_AUDIT_COMPLETE.md (Section 1.4)
**Cross-ref:** Holistic_Redesign_V2.md (Tier 3)
**Date:** 2025-10-06

---

## 🎯 CRITICAL GAPS (From Audit)

1. ❌ **No PDF/PPTX export** - Kills usefulness
2. ❌ **Static slide count** - Hardcoded 5 slides
3. ❌ **No customization** - Can't reorder/hide/add
4. ❌ **No presenter notes** - No talking points
5. ❌ **No client branding** - Missing logo/colors

---

## ✅ SOLUTION: Dynamic Slide Generation + Export

### 1. Dynamic Slide Rules

```typescript
// src/lib/presentation/slide-generator.ts

export function generateSlides(project: UnifiedProject): Slide[] {
  const slides: Slide[] = [];

  // Always: Cover
  slides.push(createCoverSlide(project));

  // If chips exist: Requirements
  if (project.presales.chips.length > 0) {
    slides.push(createRequirementsSlide(project.presales.chips));
  }

  // Always: Timeline
  slides.push(createTimelineSlide(project.timeline.phases));

  // If >3 phases: Detailed phase breakdown
  if (project.timeline.phases.length > 3) {
    slides.push(createPhaseBreakdownSlide(project.timeline.phases));
  }

  // If RICEFW items: Custom objects
  if (project.timeline.ricefwItems.length > 0) {
    slides.push(createRICEFWSlide(project.timeline.ricefwItems));
  }

  // Always: Team structure
  const teamMembers = project.timeline.phases.flatMap((p) => p.resources || []);
  if (teamMembers.length > 0) {
    slides.push(createTeamSlide(teamMembers));
  }

  // Always: Summary
  slides.push(createSummarySlide(project));

  return slides;
}
```

### 2. PDF Export (using jsPDF + html2canvas)

```typescript
// src/lib/presentation/pdf-exporter.ts

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportToPDF(slides: Slide[]): Promise<void> {
  const pdf = new jsPDF("landscape", "mm", "a4"); // 297x210mm

  for (let i = 0; i < slides.length; i++) {
    // Render slide to DOM
    const slideElement = document.getElementById(`slide-${i}`);
    if (!slideElement) continue;

    // Capture as image
    const canvas = await html2canvas(slideElement, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    // Add to PDF
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
  }

  pdf.save(`${project.name || "proposal"}.pdf`);
}
```

### 3. Presenter Notes (Per Slide)

```typescript
interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  notes?: string; // NEW
}

// Example notes
const coverSlide: Slide = {
  id: 'cover',
  title: 'Cover',
  component: <CoverSlideContent />,
  notes: `
    - Introduce yourself and team
    - Mention project timeline: ${duration}
    - Highlight key differentiators
    - Set expectations for presentation (10-15 min)
  `,
};
```

**UI for notes:**

```typescript
<div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
  <p className="text-sm">{slides[currentSlide].notes}</p>
</div>
```

---

## 📁 FILES TO CREATE/MODIFY

**New Files:**

- `src/lib/presentation/slide-generator.ts`
- `src/lib/presentation/pdf-exporter.ts`
- `src/lib/presentation/pptx-exporter.ts`

**Modified:**

- `src/components/project-v2/modes/PresentMode.tsx` - Add export buttons + notes

---

**End of PresentMode Upgrade Spec**
