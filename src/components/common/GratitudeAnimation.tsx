"use client";

/**
 * GRATITUDE ANIMATION
 *
 * Micro-moment of delight after user gets their estimate.
 * Per spec: First_Impression_Onboarding.md
 *
 * Psychology: Create positive emotion (dopamine hit) and
 * set up reciprocity ("you gave me estimate, I'll sign up")
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

interface GratitudeAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export function GratitudeAnimation({ show, onComplete }: GratitudeAnimationProps) {
  useEffect(() => {
    if (show) {
      // Track gratitude moment
      track('gratitude_animation_complete', {});

      // Auto-complete after 2 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mb-4"
        >
          <Sparkles className="w-16 h-16 mx-auto text-blue-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl text-gray-900 font-semibold mb-2">
            Your Estimate is Ready!
          </h2>
          <p className="text-lg text-gray-900 font-medium">
            Thanks for trying us out! 🎉
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
