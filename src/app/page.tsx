"use client";

/**
 * MAGIC LANDING PAGE
 * Steve Jobs Principle: "Show me the magic in 10 seconds"
 *
 * Instead of navigation cards, show immediate value:
 * - Beautiful hero with value proposition
 * - Live demo/example
 * - Clear call-to-action
 * - No navigation clutter
 */

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Clock, Sparkles, TrendingUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/common/LogoutButton";

export default function MagicLandingPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleStartProject = () => {
    router.push("/project");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isHydrated) return;
    // TODO: Process dropped RFP file and generate timeline
    router.push("/project");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Logout Button - Minimal, top-right */}
      <div className="absolute top-6 right-6 z-50">
        <LogoutButton />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight">
              From RFP to Proposal
              <br />
              in <span className="font-semibold text-blue-600">10 Minutes</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-light mb-4">
              Not 10 hours. Not 10 spreadsheets.<br />
              Just 10 minutes of your time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Average: 12 minutes to proposal</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>92% win rate improvement</span>
              </div>
            </div>
          </motion.div>

          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative border-4 border-dashed rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 transition-all duration-300 touch-manipulation ${
                !isHydrated
                  ? "border-gray-300 bg-white opacity-50 cursor-wait"
                  : isDragging
                    ? "border-blue-500 bg-blue-50 scale-105 cursor-pointer"
                    : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer active:scale-95"
              }`}
              onClick={isHydrated ? handleStartProject : undefined}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: isDragging ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload
                    className={`w-20 h-20 mx-auto mb-6 transition-colors ${
                      isDragging ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
                    }`}
                  />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Drop your RFP here</h2>

                <p className="text-base sm:text-lg text-gray-600 mb-6">
                  PDF, Word, or paste text — we&apos;ll figure it out
                </p>

                <div
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-lg transition-all ${
                    isHydrated
                      ? 'hover:bg-blue-700 hover:scale-105 cursor-pointer'
                      : 'opacity-50 cursor-wait'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isHydrated ? 'Or start from scratch' : 'Loading...'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">How it works</h2>
            <p className="text-lg sm:text-xl text-gray-600">Three simple steps to your winning proposal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                Tell us about your project
              </h3>
              <p className="text-gray-600">
                Drop your RFP or answer a few questions. Our AI extracts requirements automatically.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Magic happens</h3>
              <p className="text-gray-600">
                We calculate effort, timeline, and costs based on 142 SAP modules and industry best
                practices.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Present and win</h3>
              <p className="text-gray-600">
                Beautiful timeline, accurate costs, and intelligent insights ready to share with
                your client.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-light text-white mb-8">
              Trusted by SAP consultants worldwide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">12min</div>
                <div className="text-base sm:text-lg text-blue-100">Average time to proposal</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">92%</div>
                <div className="text-base sm:text-lg text-blue-100">Win rate improvement</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">142</div>
                <div className="text-base sm:text-lg text-blue-100">SAP modules supported</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6">Ready to win more deals?</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-12">
            Start creating winning proposals in minutes, not weeks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/estimator')}
              disabled={!isHydrated}
              className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-xl transition-all ${
                isHydrated
                  ? 'hover:shadow-2xl hover:scale-105 cursor-pointer'
                  : 'opacity-50 cursor-wait'
              }`}
            >
              {isHydrated ? 'Try Quick Estimate (No login required)' : 'Loading...'}
            </button>
            <button
              onClick={handleStartProject}
              disabled={!isHydrated}
              className={`px-6 py-3 bg-white text-gray-700 text-lg font-medium rounded-xl border-2 border-gray-300 transition-all ${
                isHydrated
                  ? 'hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                  : 'opacity-50 cursor-wait'
              }`}
            >
              {isHydrated ? 'Full Demo →' : 'Loading...'}
            </button>
          </div>

          {isHydrated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-sm text-gray-500"
            >
              Get a ballpark number in 30 seconds. No credit card. No commitment.
            </motion.p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>© 2025 SAP Implementation Cockpit. Built for SAP consultants.</p>
        </div>
      </div>
    </div>
  );
}
