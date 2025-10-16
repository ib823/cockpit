"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Calendar, Users, Flag, TrendingUp, FileDown, StickyNote } from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";
import { usePresalesStore } from "@/stores/presales-store";
import { formatDuration, cn } from "@/lib/utils";
import { generateSlides } from "@/lib/presentation/slide-generator";
import { exportToPDF } from "@/lib/presentation/pdf-exporter";
import { track } from "@/lib/analytics";

interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  notes?: string;
}

export function PresentMode() {
  const { phases } = useTimelineStore();
  const { chips } = usePresalesStore();
  
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate summary stats (hide costs for client)
  const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);
  const totalResources = phases.reduce((sum, phase) => sum + (phase.resources?.length || 0), 0);

  // Generate dynamic notes (from slide-generator)
  const dynamicSlides = generateSlides("SAP Implementation", chips, phases, []);

  // Create slides
  const slides: Slide[] = [
    {
      id: "cover",
      title: "Cover",
      component: (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-7xl font-thin mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your SAP Implementation Plan
            </h1>
            <p className="text-3xl text-gray-400 font-light">
              {formatDuration(totalDuration)} · {phases.length} phases · {totalResources}{" "}
              consultants
            </p>
          </motion.div>
        </div>
      ),
    },
    {
      id: "requirements",
      title: "Requirements",
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Project Requirements
          </motion.h2>
          <div className="grid grid-cols-2 gap-6">
            {chips.slice(0, 8).map((chip, i) => (
              <motion.div
                key={chip.id || i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                  {chip.type}
                </div>
                <div className="text-xl font-light">{chip.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "timeline",
      title: "Timeline",
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Implementation Timeline
          </motion.h2>
          <div className="space-y-8">
            {phases.map((phase, i) => {
              const widthPercent = (phase.workingDays / totalDuration) * 100;

              return (
                <motion.div
                  key={phase.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-light">{phase.name}</h3>
                    <span className="text-gray-400">{formatDuration(phase.workingDays)}</span>
                  </div>
                  <div
                    className="h-20 rounded-2xl relative overflow-hidden"
                    style={{
                      width: `${Math.max(widthPercent, 20)}%`,
                      background: `linear-gradient(135deg, ${phase.color || `hsl(${i * 60}, 60%, 50%)`}, ${phase.color || `hsl(${i * 60}, 60%, 40%)`})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                    <div className="relative h-full px-6 flex items-center">
                      <div className="text-white/80 text-sm">
                        {phase.resources?.length || 0} team members
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: "team",
      title: "Team Structure",
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Team Structure
          </motion.h2>
          <div className="grid grid-cols-3 gap-8">
            {phases.slice(0, 6).map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-light mb-2">{phase.name}</h3>
                <div className="text-3xl font-thin text-gray-300">
                  {phase.resources?.length || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">consultants</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "summary",
      title: "Summary",
      component: (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-5xl font-light mb-12">Project Summary</h2>

            <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div>
                <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <div className="text-4xl font-thin mb-2">{formatDuration(totalDuration)}</div>
                <div className="text-gray-400">Duration</div>
              </div>

              <div>
                <Flag className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <div className="text-4xl font-thin mb-2">{phases.length}</div>
                <div className="text-gray-400">Phases</div>
              </div>

              <div>
                <Users className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <div className="text-4xl font-thin mb-2">{totalResources}</div>
                <div className="text-gray-400">Team Members</div>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16 pt-12 border-t border-white/10"
            >
              <p className="text-2xl font-light text-gray-300">
                Ready to transform your business with SAP
              </p>
            </motion.div>
          </motion.div>
        </div>
      ),
    },
  ];

  // Merge dynamic notes into slides
  const slidesWithNotes = slides.map((slide) => {
    const dynamicSlide = dynamicSlides.find((ds) => ds.id === slide.id);
    return {
      ...slide,
      notes: dynamicSlide?.notes || "",
    };
  });

  // PDF Export handler
  const handleExportPDF = async () => {
    setIsExporting(true);
    track("presentation_export_started", { slideCount: slidesWithNotes.length });

    try {
      // Collect all slide DOM elements for PDF export
      const slideElements: HTMLElement[] = [];
      slidesWithNotes.forEach((slide, idx) => {
        const element = document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
        if (element) {
          slideElements.push(element);
        }
      });

      if (slideElements.length === 0) {
        throw new Error("No slide elements found for export");
      }

      await exportToPDF(slideElements, {
        fileName: "SAP-Implementation-Proposal.pdf",
        quality: 0.95,
        format: "16:9"
      });
      track("presentation_export_complete", { slideCount: slideElements.length });
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
      } else if (e.key === "ArrowRight" && currentSlide < slidesWithNotes.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === "Escape") {
        router.push("/project/plan");
      } else if (e.key === "n" || e.key === "N") {
        // Toggle notes with 'n' key
        setShowNotes(!showNotes);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, slidesWithNotes.length, router, showNotes]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Main slide container */}
      <div className="container mx-auto h-full flex items-center justify-center px-16">
        <div className="max-w-6xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              data-slide-id={slidesWithNotes[currentSlide].id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {slidesWithNotes[currentSlide].component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {slidesWithNotes.map((slide, i) => (
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
          onClick={() => setCurrentSlide(Math.min(slidesWithNotes.length - 1, currentSlide + 1))}
          disabled={currentSlide === slidesWithNotes.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Top Controls */}
      <div className="fixed top-8 right-8 flex items-center gap-4">
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
          onClick={() => router.push("/project/plan")}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                     flex items-center justify-center hover:bg-white/20 transition-colors group"
          aria-label="Exit presentation"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="fixed top-8 left-8 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
        {currentSlide + 1} / {slidesWithNotes.length}
      </div>

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
              {slidesWithNotes[currentSlide].notes ? (
                <div className="whitespace-pre-wrap text-gray-300">
                  {slidesWithNotes[currentSlide].notes}
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
