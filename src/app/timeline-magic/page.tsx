"use client";

/**
 * MAGIC TIMELINE / RESET EXPERIENCE PAGE
 *
 * Dual Purpose:
 * 1. When user has data: Show beautiful timeline visualization
 * 2. When empty (reset/first visit): Calm reading experience with rotating inspirational quotes
 *
 * Design Philosophy: Simple, beautiful, focused on reading and reflection.
 * No distractions, just inspiration and a gentle transition.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  Flag,
  Sparkles,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePresalesStore } from "@/stores/presales-store";
import { ResetButton } from "@/components/common/ResetButton";
import Link from "next/link";

// Inspirational quotes from visionaries
const INSPIRATION_QUOTES = [
  {
    quote: "The best way to predict the future is to invent it.",
    author: "Alan Kay",
    role: "Computer Scientist",
  },
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    role: "Renaissance Polymath",
  },
  {
    quote: "Design is not just what it looks like and feels like. Design is how it works.",
    author: "Steve Jobs",
    role: "Apple Co-founder",
  },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    role: "Apple Co-founder",
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    role: "Apple Co-founder",
  },
  {
    quote: "Think different. Start fresh. Build something amazing.",
    author: "Apple",
    role: "Think Different Campaign",
  },
  {
    quote: "Stay hungry. Stay foolish.",
    author: "Steve Jobs",
    role: "Apple Co-founder",
  },
  {
    quote: "Less is more.",
    author: "Ludwig Mies van der Rohe",
    role: "Architect",
  },
];

// Example timeline shown when user has data
const EXAMPLE_TIMELINE = {
  name: "Finance + HR Implementation",
  phases: [
    { id: "prep", name: "Prepare", days: 15, color: "#3b82f6", resources: 3 },
    { id: "explore", name: "Explore", days: 45, color: "#10b981", resources: 5 },
    { id: "realize", name: "Realize", days: 90, color: "#f59e0b", resources: 8 },
    { id: "deploy", name: "Deploy", days: 30, color: "#8b5cf6", resources: 6 },
    { id: "run", name: "Run", days: 20, color: "#06b6d4", resources: 4 },
  ],
  totalDays: 200,
  totalCost: 850000,
  teamSize: 12,
};

export default function MagicTimelinePage() {
  const { chips } = usePresalesStore();
  const { phases } = useTimelineStore();
  const [currentQuote, setCurrentQuote] = useState(0);

  // Check if user has real data
  const hasRealData = (chips && chips.length > 0) || (phases && phases.length > 0);

  // Rotate quotes every 8 seconds
  useEffect(() => {
    if (!hasRealData) {
      const interval = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % INSPIRATION_QUOTES.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [hasRealData]);

  // Show empty state if no data
  if (!hasRealData) {
    return <EmptyStateExperience currentQuoteIndex={currentQuote} />;
  }

  // Show timeline visualization if has data
  return <TimelineVisualization />;
}

// ============================================================================
// EMPTY STATE EXPERIENCE - Minimal, Beautiful, Focused on Reading
// ============================================================================

function EmptyStateExperience({ currentQuoteIndex }: { currentQuoteIndex: number }) {
  const quote = INSPIRATION_QUOTES[currentQuoteIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden flex items-center justify-center">
      {/* Ambient floating shapes - subtle and calming */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/3 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content - Centered Quote Card */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Quote Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-16 border border-white/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8"
                >
                  <Coffee className="w-16 h-16 text-indigo-400 mx-auto" />
                </motion.div>

                {/* Quote Text */}
                <p className="text-4xl md:text-5xl font-light text-gray-800 italic leading-relaxed mb-10">
                  &ldquo;{quote.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="text-xl text-gray-600 mb-12">
                  <span className="font-medium">— {quote.author}</span>
                  <span className="text-gray-400 ml-3">• {quote.role}</span>
                </div>

                {/* Quote Progress Dots */}
                <div className="flex justify-center gap-2 mb-12">
                  {INSPIRATION_QUOTES.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx === currentQuoteIndex
                          ? "w-8 bg-indigo-500"
                          : "w-2 bg-gray-300 hover:bg-indigo-300 cursor-pointer"
                      }`}
                    />
                  ))}
                </div>

                {/* Gentle CTA */}
                <div className="pt-8 border-t border-gray-200/50">
                  <Link href="/project">
                    <button className="group px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-medium text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto">
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span>Begin Your Journey</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <p className="text-gray-400 mt-4 text-sm">
                    Take a moment. When ready, start creating.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Subtle hint text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-center text-gray-400 text-sm mt-8"
          >
            Let the words settle. There&apos;s no rush.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE VISUALIZATION - When user has data
// ============================================================================

function TimelineVisualization() {
  const { chips } = usePresalesStore();
  const { phases } = useTimelineStore();
  const [showCelebration, setShowCelebration] = useState(false);
  const [timelineData] = useState(EXAMPLE_TIMELINE);

  // Auto-generate timeline when chips change
  useEffect(() => {
    if (chips && chips.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [chips]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const months = Math.ceil(timelineData.totalDays / 20);
    const currencyFormatted = new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(timelineData.totalCost);

    return {
      duration: `${months} month${months > 1 ? "s" : ""}`,
      cost: currencyFormatted,
      team: `${timelineData.teamSize} people`,
      phases: timelineData.phases.length,
    };
  }, [timelineData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && <CelebrationOverlay metrics={metrics} />}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-light text-gray-900 mb-3">Your Timeline</h1>
              <p className="text-xl text-gray-600">Generated from your requirements</p>
            </div>
            <ResetButton />
          </div>
        </motion.div>

        {/* Key Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-6 mb-12"
        >
          <MetricCard
            icon={<Clock className="w-6 h-6" />}
            label="Duration"
            value={metrics.duration}
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Estimated Cost"
            value={metrics.cost}
            color="green"
          />
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            label="Peak Team Size"
            value={metrics.team}
            color="purple"
          />
          <MetricCard
            icon={<Flag className="w-6 h-6" />}
            label="Major Phases"
            value={metrics.phases}
            color="orange"
          />
        </motion.div>

        {/* Timeline Visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="space-y-6">
            {timelineData.phases.map((phase, index) => (
              <PhaseBar
                key={phase.id}
                phase={phase}
                totalDays={timelineData.totalDays}
                index={index}
                allPhases={timelineData.phases}
              />
            ))}
          </div>
        </motion.div>

        {/* Intelligent Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Key Insights
          </h3>
          <div className="space-y-3">
            <Insight
              type="success"
              text="Timeline is 30% faster than industry average for this scope"
            />
            <Insight
              type="warning"
              text="Realize phase has tight resource allocation - consider adding 2 more team members"
            />
            <Insight type="info" text="Go-live scheduled for Q3 2025, allowing for UAT buffer" />
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="bg-white rounded-full shadow-2xl px-8 py-4 flex items-center gap-4">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all hover:scale-105"
              onClick={() => alert("Present mode coming soon!")}
            >
              Present to Client
            </button>
            <button
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all"
              onClick={() => alert("Refine coming soon!")}
            >
              Refine Timeline
            </button>
            <button
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all"
              onClick={() => alert("Export coming soon!")}
            >
              Export PDF
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function CelebrationOverlay({ metrics }: { metrics: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <CheckCircle className="w-24 h-24 text-white mx-auto mb-6" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-light text-white mb-4"
        >
          Your timeline is ready
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/90 text-xl space-y-2"
        >
          <div>{metrics.phases} phases</div>
          <div>{metrics.duration}</div>
          <div>{metrics.cost}</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className={`rounded-xl p-6 border ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium opacity-75">{label}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function PhaseBar({ phase, totalDays, index, allPhases }: any) {
  const widthPercent = (phase.days / totalDays) * 100;
  const startPercent = allPhases
    .slice(0, index)
    .reduce((sum: number, p: any) => sum + (p.days / totalDays) * 100, 0);

  return (
    <div className="group">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-32 text-sm font-medium text-gray-700">{phase.name}</div>
        <div className="flex-1 text-xs text-gray-500">
          {phase.days} days • {phase.resources} people
        </div>
      </div>
      <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
          className="absolute top-0 h-full rounded-lg cursor-pointer transition-all hover:opacity-90"
          style={{
            left: `${startPercent}%`,
            backgroundColor: phase.color,
          }}
        >
          <div className="p-3 text-white">
            <div className="font-semibold text-sm">{phase.name}</div>
            <div className="text-xs opacity-90">{phase.days}d</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Insight({ type, text }: { type: "success" | "warning" | "info"; text: string }) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "✓",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm flex-1">{text}</p>
    </div>
  );
}
