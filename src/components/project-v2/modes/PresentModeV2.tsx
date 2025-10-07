"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";
import { usePresalesStore } from "@/stores/presales-store";
import { cn } from "@/lib/utils";
import {
  generateSlides,
  reorderSlides,
  toggleSlideVisibility,
  type SlideConfig,
} from "@/lib/presentation/slide-generator";
import {
  CoverSlide,
  RequirementsSlide,
  TimelineSlide,
  PhaseBreakdownSlide,
  TeamStructureSlide,
  RICEFWSlide,
  MilestonesSlide,
  SummarySlide,
} from "./slides/SlideComponents";

export function PresentModeV2() {
  const { phases } = useTimelineStore();
  const { chips } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [slideConfigs, setSlideConfigs] = useState<SlideConfig[]>([]);

  // Generate slides based on project data
  useEffect(() => {
    const generated = generateSlides({
      phases,
      chips,
      projectName: "SAP Implementation",
    });
    setSlideConfigs(generated);
  }, [phases, chips]);

  // Filter enabled slides
  const enabledSlides = useMemo(
    () => slideConfigs.filter((s) => s.enabled),
    [slideConfigs]
  );

  // Render slide component based on type
  const renderSlide = (config: SlideConfig) => {
    const props = { phases, chips, projectName: "SAP Implementation" };

    switch (config.type) {
      case "cover":
        return <CoverSlide {...props} />;
      case "requirements":
        return <RequirementsSlide {...props} />;
      case "timeline":
        return <TimelineSlide {...props} />;
      case "phase-breakdown":
        return <PhaseBreakdownSlide {...props} />;
      case "team":
        return <TeamStructureSlide {...props} />;
      case "ricefw":
        return <RICEFWSlide {...props} />;
      case "milestones":
        return <MilestonesSlide {...props} />;
      case "summary":
        return <SummarySlide {...props} />;
      default:
        return <div>Unknown slide type</div>;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === "ArrowRight" && currentSlide < enabledSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === "Escape") {
        setMode("plan");
      } else if (e.key === "s" || e.key === "S") {
        setShowSettings(!showSettings);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, enabledSlides.length, setMode, showSettings]);

  // Handle slide reorder
  const handleReorder = (fromIndex: number, toIndex: number) => {
    const reordered = reorderSlides(slideConfigs, fromIndex, toIndex);
    setSlideConfigs(reordered);
  };

  // Handle slide visibility toggle
  const handleToggleVisibility = (slideId: string) => {
    const updated = toggleSlideVisibility(slideConfigs, slideId);
    setSlideConfigs(updated);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Main slide container */}
      <div className="container mx-auto h-full flex items-center justify-center px-16">
        <div className="max-w-6xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {enabledSlides[currentSlide] && renderSlide(enabledSlides[currentSlide])}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {enabledSlides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              "transition-all rounded-full",
              i === currentSlide ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
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
          onClick={() => setCurrentSlide(Math.min(enabledSlides.length - 1, currentSlide + 1))}
          disabled={currentSlide === enabledSlides.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-8 left-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                   flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="Slide settings"
      >
        <Settings className={cn("w-6 h-6 transition-transform", showSettings && "rotate-90")} />
      </button>

      {/* Exit button */}
      <button
        onClick={() => setMode("plan")}
        className="fixed top-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                   flex items-center justify-center hover:bg-white/20 transition-colors group"
        aria-label="Exit presentation"
      >
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Slide counter */}
      <div className="fixed top-24 left-8 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
        {currentSlide + 1} / {enabledSlides.length}
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="fixed top-32 left-8 w-96 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-light mb-4">Slide Management</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {slideConfigs.map((slide, index) => (
                <div
                  key={slide.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <button
                    className="cursor-move"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  <span className="flex-1 text-sm">{slide.title}</span>
                  <button
                    onClick={() => handleToggleVisibility(slide.id)}
                    className="p-1 hover:bg-white/10 rounded"
                    aria-label={slide.enabled ? "Hide slide" : "Show slide"}
                  >
                    {slide.enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Press 'S' to toggle settings · Drag slides to reorder
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
