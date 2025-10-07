/**
 * SLIDE GENERATOR TESTS
 *
 * Tests for dynamic slide generation based on project data.
 */

import { describe, it, expect } from 'vitest';
import { generateSlides, reorderSlides, toggleSlideVisibility } from '@/lib/presentation/slide-generator';
import type { Chip, Phase } from '@/types/core';

describe('Slide Generator', () => {
  const mockChips: Chip[] = [
    {
      id: '1',
      type: 'COUNTRY',
      value: 'Malaysia',
      confidence: 0.9,
      source: 'manual',
      extractedAt: new Date(),
    },
    {
      id: '2',
      type: 'INDUSTRY',
      value: 'Manufacturing',
      confidence: 0.8,
      source: 'manual',
      extractedAt: new Date(),
    },
  ];

  const mockPhases: Phase[] = [
    {
      id: 'phase-1',
      name: 'Discovery',
      startBusinessDay: 0,
      workingDays: 20,
      effort: 100,
      color: '#3b82f6',
      resources: ['PM', 'BA'],
    },
    {
      id: 'phase-2',
      name: 'Design',
      startBusinessDay: 20,
      workingDays: 30,
      effort: 150,
      color: '#8b5cf6',
      resources: ['PM', 'BA', 'Architect'],
    },
    {
      id: 'phase-3',
      name: 'Build',
      startBusinessDay: 50,
      workingDays: 60,
      effort: 300,
      color: '#10b981',
      resources: ['PM', 'Developer', 'Developer', 'QA'],
    },
    {
      id: 'phase-4',
      name: 'Deploy',
      startBusinessDay: 110,
      workingDays: 20,
      effort: 80,
      color: '#f59e0b',
      resources: ['PM', 'DevOps'],
    },
  ];

  describe('generateSlides', () => {
    it('should always generate cover, timeline, and summary slides', () => {
      const slides = generateSlides('Test Project', [], [], []);

      expect(slides.length).toBeGreaterThanOrEqual(3);
      expect(slides.some(s => s.id === 'cover')).toBe(true);
      expect(slides.some(s => s.id === 'timeline')).toBe(true);
      expect(slides.some(s => s.id === 'summary')).toBe(true);
    });

    it('should include requirements slide when chips exist', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      expect(slides.some(s => s.id === 'requirements')).toBe(true);
    });

    it('should NOT include requirements slide when no chips', () => {
      const slides = generateSlides('Test Project', [], mockPhases, []);

      expect(slides.some(s => s.id === 'requirements')).toBe(false);
    });

    it('should include phase breakdown slide when >3 phases', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      expect(slides.some(s => s.id === 'phase-breakdown')).toBe(true);
    });

    it('should NOT include phase breakdown when <=3 phases', () => {
      const fewPhases = mockPhases.slice(0, 3);
      const slides = generateSlides('Test Project', mockChips, fewPhases, []);

      expect(slides.some(s => s.id === 'phase-breakdown')).toBe(false);
    });

    it('should include team slide when resources exist', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      expect(slides.some(s => s.id === 'team')).toBe(true);
    });

    it('should include RICEFW slide when items exist', () => {
      const ricefwItems = [
        {
          id: '1',
          type: 'report' as const,
          name: 'Sales Report',
          complexity: 'M' as const,
          effort: 5,
        },
      ];

      const slides = generateSlides('Test Project', mockChips, mockPhases, ricefwItems);

      expect(slides.some(s => s.id === 'ricefw')).toBe(true);
    });

    it('should NOT include RICEFW slide when no items', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      expect(slides.some(s => s.id === 'ricefw')).toBe(false);
    });

    it('should generate correct number of slides based on data', () => {
      // With chips + >3 phases + team + no RICEFW = 6 slides
      // (cover, requirements, timeline, phase-breakdown, team, summary)
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      expect(slides.length).toBe(6);
    });

    it('should include notes for each slide', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      slides.forEach(slide => {
        expect(slide.notes).toBeDefined();
        expect(typeof slide.notes).toBe('string');
      });
    });

    it('should include component for each slide', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);

      slides.forEach(slide => {
        expect(slide.component).toBeDefined();
      });
    });
  });

  describe('reorderSlides', () => {
    it('should reorder slides correctly', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);
      const originalFirstSlide = slides[0];
      const originalSecondSlide = slides[1];

      const reordered = reorderSlides(slides, 0, 1);

      expect(reordered[0].id).toBe(originalSecondSlide.id);
      expect(reordered[1].id).toBe(originalFirstSlide.id);
    });

    it('should not mutate original array', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);
      const originalLength = slides.length;
      const originalFirstId = slides[0].id;

      reorderSlides(slides, 0, 1);

      expect(slides.length).toBe(originalLength);
      expect(slides[0].id).toBe(originalFirstId);
    });
  });

  describe('toggleSlideVisibility', () => {
    it('should hide a slide', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);
      const slideToHide = slides[0].id;

      const updated = toggleSlideVisibility(slides, slideToHide, true);
      const hiddenSlide = updated.find(s => s.id === slideToHide);

      expect(hiddenSlide?.hidden).toBe(true);
    });

    it('should show a hidden slide', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);
      const slideToShow = slides[0].id;

      // First hide it
      let updated = toggleSlideVisibility(slides, slideToShow, true);
      expect(updated.find(s => s.id === slideToShow)?.hidden).toBe(true);

      // Then show it
      updated = toggleSlideVisibility(updated, slideToShow, false);
      const shownSlide = updated.find(s => s.id === slideToShow);

      expect(shownSlide?.hidden).toBe(false);
    });

    it('should not mutate original array', () => {
      const slides = generateSlides('Test Project', mockChips, mockPhases, []);
      const originalFirstHidden = slides[0].hidden;

      toggleSlideVisibility(slides, slides[0].id, true);

      expect(slides[0].hidden).toBe(originalFirstHidden);
    });
  });

  describe('Dynamic slide count validation', () => {
    it('should generate 3 slides minimum (cover, timeline, summary)', () => {
      const slides = generateSlides('Empty Project', [], [], []);

      expect(slides.length).toBe(3);
    });

    it('should generate up to 8 slides with all features', () => {
      const ricefwItems = [
        {
          id: '1',
          type: 'report' as const,
          name: 'Sales Report',
          complexity: 'M' as const,
          effort: 5,
        },
      ];

      const slides = generateSlides('Full Project', mockChips, mockPhases, ricefwItems);

      // cover, requirements, timeline, phase-breakdown, ricefw, team, summary = 7 slides
      expect(slides.length).toBe(7);
      expect(slides.length).toBeLessThanOrEqual(8);
    });
  });
});
