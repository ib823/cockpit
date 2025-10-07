"use client";

/**
 * LANDING PAGE - Steve Jobs/Jony Ive Redesign
 *
 * Principles:
 * 1. One clear choice
 * 2. Instant value (Quick Estimate = 30 seconds)
 * 3. Zero fluff
 * 4. Beautiful simplicity
 */

import { motion } from "framer-motion";
import { ArrowRight, Zap, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/common/LogoutButton";

export default function LandingPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Centered Logout */}
      <div className="w-full py-6 px-6 flex justify-center items-center border-b border-gray-100">
        <div className="w-full max-w-4xl flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">SAP Cockpit</h1>
          <LogoutButton />
        </div>
      </div>

      {/* Hero - Maximum Focus */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl text-center"
        >
          {/* Headline - Minimal */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-light text-gray-900 mb-8 tracking-tight">
            SAP Proposals
            <br />
            <span className="font-medium">in 30 Seconds</span>
          </h2>

          {/* Two Clear Choices */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16">
            {/* PRIMARY: Quick Estimate */}
            <motion.button
              onClick={() => isHydrated && router.push('/estimator')}
              disabled={!isHydrated}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`group relative w-full sm:w-80 h-72 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-2xl transition-all ${
                isHydrated ? 'hover:scale-105 hover:shadow-3xl cursor-pointer' : 'opacity-50 cursor-wait'
              }`}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <Zap className="w-12 h-12 mb-4" />
                  <h3 className="text-3xl font-semibold mb-3">Quick Estimate</h3>
                  <p className="text-blue-100 text-lg">
                    Get cost and timeline in 30 seconds
                  </p>
                </div>
                <div className="flex items-center justify-between text-blue-100">
                  <span className="text-sm font-medium">Start →</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>

            {/* SECONDARY: Full Project */}
            <motion.button
              onClick={() => isHydrated && router.push('/project')}
              disabled={!isHydrated}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`group relative w-full sm:w-80 h-72 rounded-2xl bg-white border-2 border-gray-200 p-8 text-gray-900 shadow-lg transition-all ${
                isHydrated ? 'hover:scale-105 hover:border-gray-300 hover:shadow-xl cursor-pointer' : 'opacity-50 cursor-wait'
              }`}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <FileText className="w-12 h-12 mb-4 text-gray-700" />
                  <h3 className="text-3xl font-semibold mb-3">Full Project</h3>
                  <p className="text-gray-600 text-lg">
                    Complete timeline with resource planning
                  </p>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-sm font-medium">Create →</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          </div>

          {/* Subtle Hint */}
          {isHydrated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-sm text-gray-500"
            >
              No signup required for Quick Estimate
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Footer - Minimal */}
      <div className="w-full py-6 text-center">
        <p className="text-xs text-gray-400">© 2025 SAP Implementation Cockpit</p>
      </div>
    </div>
  );
}
