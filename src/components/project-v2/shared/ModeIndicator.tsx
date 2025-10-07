"use client";

import { type ProjectMode } from "@/stores/project-store";
import { FileText, CheckCircle, LayoutGrid, Presentation, Sparkles, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ResetButton } from "./ResetButton";

interface ModeConfig {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  textColor: string;
}

const MODE_CONFIG: Record<ProjectMode, ModeConfig> = {
  capture: {
    icon: FileText,
    title: "Extract Requirements",
    subtitle: "Drop your RFP or paste text to identify project requirements",
    gradient: "from-blue-500 to-blue-700",
    textColor: "text-blue-50",
  },
  decide: {
    icon: CheckCircle,
    title: "Make Key Decisions",
    subtitle: "Shape your project with 5 strategic decisions",
    gradient: "from-purple-500 to-purple-700",
    textColor: "text-purple-50",
  },
  plan: {
    icon: LayoutGrid,
    title: "Plan Timeline",
    subtitle: "Timeline, Resources & RICEFW",
    gradient: "from-green-500 to-green-700",
    textColor: "text-green-50",
  },
  present: {
    icon: Presentation,
    title: "Present Mode",
    subtitle: "Client-ready presentation view",
    gradient: "from-gray-900 to-black",
    textColor: "text-gray-50",
  },
};

interface ModeIndicatorProps {
  mode: ProjectMode;
  progress?: number;
  showProgress?: boolean;
}

export function ModeIndicator({
  mode,
  progress,
  showProgress = mode === "capture",
}: ModeIndicatorProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${config.gradient} px-8 py-6 text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Icon className="w-10 h-10" strokeWidth={1.5} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-light tracking-tight">{config.title}</h1>
            <p className={`${config.textColor} mt-1 text-sm font-light`}>{config.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showProgress && typeof progress === "number" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm font-medium">{progress}% Complete</span>
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </motion.div>
          )}

          {/* Reset Button (always visible) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <ResetButton />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
