"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, FileDown, StickyNote, Eye, EyeOff, GripVertical } from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";
import { usePresalesStore } from "@/stores/presales-store";
import { cn } from "@/lib/utils";
import { generateSlides, reorderSlides, type Slide } from "@/lib/presentation/slide-generator";
import { exportToPDF } from "@/lib/presentation/pdf-exporter";
import { track } from "@/lib/analytics";

export function PresentMode() {
  const { phases } = useTimelineStore();
  const { chips } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSlideManager, setShowSlideManager] = useState(false);

  // TODO: Get RICEFW items from unified project store
  const ricefwItems: any[] = [];

  // Generate dynamic slides based on project data
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const generatedSlides = generateSlides("SAP Implementation", chips, phases, ricefwItems);
    setSlides(generatedSlides);
  }, [chips, phases, ricefwItems]);

  // Filter out hidden slides for display
  const visibleSlides = useMemo(() => slides.filter(slide => !slide.hidden), [slides]);

  // Slide visibility toggle
  const toggleSlideVisibility = (slideId: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === slideId ? { ...slide, hidden: !slide.hidden } : slide
      )
    );
  };

  // Slide reordering
  const moveSlide = (fromIndex: number, toIndex: number) => {
    const reordered = reorderSlides(slides, fromIndex, toIndex);
    setSlides(reordered);
  };

  // PDF Export handler
  const handleExportPDF = async () => {
    setIsExporting(true);
    track("presentation_export_started", { slideCount: visibleSlides.length });

    try {
      await exportToPDF(visibleSlides, "SAP Implementation Proposal");
      track("presentation_export_complete", { slideCount: visibleSlides.length });
    } catch (error) {
      console.error("[PresentMode] PDF export failed:", error);
      track("presentation_export_failed", { error: String(error) });
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === "ArrowRight" && currentSlide < visibleSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === "Escape") {
        setMode("plan");
      } else if (e.key === "n" || e.key === "N") {
        // Toggle notes with 'n' key
        setShowNotes(!showNotes);
      } else if (e.key === "m" || e.key === "M") {
        // Toggle slide manager with 'm' key
        setShowSlideManager(!showSlideManager);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, visibleSlides.length, setMode, showNotes, showSlideManager]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Main slide container */}
      <div className="container mx-auto h-full flex items-center justify-center px-16">
        <div className="max-w-6xl w-full">
          {visibleSlides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {visibleSlides[currentSlide]?.component}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-2xl">No slides to display</p>
              <p className="mt-4">Add some project data to generate slides</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {visibleSlides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              "transition-all rounded-full",
              i === currentSlide ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="fixed bottom-12 left-12">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="fixed bottom-12 right-12">
        <button
          onClick={() => setCurrentSlide(Math.min(visibleSlides.length - 1, currentSlide + 1))}
          disabled={currentSlide === visibleSlides.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Top Controls */}
      <div className="fixed top-8 right-8 flex items-center gap-3">
        {/* Slide Manager button */}
        <button
          onClick={() => setShowSlideManager(!showSlideManager)}
          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2
                     hover:bg-white/20 transition-colors"
          aria-label="Manage slides"
        >
          <GripVertical className="w-5 h-5" />
          <span className="text-sm">Manage ({slides.length})</span>
        </button>

        {/* Export PDF button */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2
                     hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export to PDF"
        >
          <FileDown className="w-5 h-5" />
          <span className="text-sm">{isExporting ? "Exporting..." : "Export PDF"}</span>
        </button>

        {/* Exit button */}
        <button
          onClick={() => setMode("plan")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                     flex items-center justify-center hover:bg-white/20 transition-colors group"
          aria-label="Exit presentation"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="fixed top-8 left-8 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
        {currentSlide + 1} / {visibleSlides.length}
        {slides.length !== visibleSlides.length && (
          <span className="ml-2 text-gray-400">({slides.length - visibleSlides.length} hidden)</span>
        )}
      </div>

      {/* Slide Manager Panel */}
      <AnimatePresence>
        {showSlideManager && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-lg border-l border-white/10 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light">Manage Slides</h3>
                <button
                  onClick={() => setShowSlideManager(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      slide.hidden
                        ? "bg-white/5 border-white/10 opacity-50"
                        : "bg-white/10 border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="font-medium">{slide.title}</span>
                      </div>
                      <button
                        onClick={() => toggleSlideVisibility(slide.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title={slide.hidden ? "Show slide" : "Hide slide"}
                      >
                        {slide.hidden ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => moveSlide(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↑ Up
                      </button>
                      <button
                        onClick={() => moveSlide(index, Math.min(slides.length - 1, index + 1))}
                        disabled={index === slides.length - 1}
                        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↓ Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presenter Notes Panel */}
      <motion.div
        initial={false}
        animate={{ y: showNotes ? 0 : "calc(100% - 48px)" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10"
      >
        {/* Toggle button */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            <span className="font-medium">Presenter Notes</span>
            <span className="text-xs text-gray-400">(Press &apos;N&apos; to toggle)</span>
          </div>
          <motion.div
            animate={{ rotate: showNotes ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 -rotate-90" />
          </motion.div>
        </button>

        {/* Notes content */}
        {showNotes && (
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none">
              {visibleSlides[currentSlide]?.notes ? (
                <div className="whitespace-pre-wrap text-gray-300">
                  {visibleSlides[currentSlide].notes}
                </div>
              ) : (
                <p className="text-gray-500 italic">No notes for this slide</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
