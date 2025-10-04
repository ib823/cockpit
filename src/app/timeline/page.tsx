"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

/**
 * Timeline Page - Redirect to unified /project workflow
 *
 * This page now redirects to /project with Plan mode active
 * to provide a unified, Steve Jobs-level UX experience.
 */
export default function TimelinePage() {
  const router = useRouter();
  const setMode = useProjectStore((state) => state.setMode);

  useEffect(() => {
    // Set mode to plan and redirect
    setMode("plan");

    // Small delay for smooth transition
    const timer = setTimeout(() => {
      router.push("/project");
    }, 100);

    return () => clearTimeout(timer);
  }, [router, setMode]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6"
        >
          <Calendar className="w-16 h-16 text-blue-500" />
        </motion.div>

        <h1 className="text-2xl font-light text-gray-900 mb-2">
          Redirecting to Project Timeline...
        </h1>

        <p className="text-gray-600 flex items-center justify-center gap-2">
          <span>Opening unified workspace</span>
          <ArrowRight className="w-4 h-4" />
        </p>
      </motion.div>
    </div>
  );
}
