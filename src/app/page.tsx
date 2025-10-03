'use client';

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

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, Sparkles, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function MagicLandingPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const handleStartDemo = () => {
    router.push('/timeline-magic');
  };

  const handleStartProject = () => {
    router.push('/project');
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
    // TODO: Process dropped RFP file
    router.push('/project?mode=capture');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

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
            <h1 className="text-7xl font-light text-gray-900 mb-6 tracking-tight">
              Turn weeks of estimation
              <br />
              into <span className="font-semibold text-blue-600">15 minutes</span>
            </h1>

            <p className="text-2xl text-gray-600 font-light mb-4">
              SAP consultants worldwide use Cockpit to win deals faster
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
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
              className={`group relative border-4 border-dashed rounded-3xl p-20 transition-all duration-300 cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
              }`}
              onClick={handleStartProject}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: isDragging ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className={`w-20 h-20 mx-auto mb-6 transition-colors ${
                    isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                  }`} />
                </motion.div>

                <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                  Drop your RFP here
                </h2>

                <p className="text-lg text-gray-600 mb-6">
                  PDF, Word, or paste text — we'll figure it out
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-lg hover:bg-blue-700 transition-all hover:scale-105">
                  <Sparkles className="w-5 h-5" />
                  <span>Or start from scratch</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Demo Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Want to see it in action first?
            </p>

            <button
              onClick={handleStartDemo}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-medium shadow-md hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <span>View Example Timeline</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">2 min</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your winning proposal
            </p>
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Magic happens
              </h3>
              <p className="text-gray-600">
                We calculate effort, timeline, and costs based on 142 SAP modules and industry best practices.
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Present & win
              </h3>
              <p className="text-gray-600">
                Beautiful timeline, accurate costs, and intelligent insights ready to share with your client.
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
            <h2 className="text-4xl font-light text-white mb-8">
              Trusted by SAP consultants worldwide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div>
                <div className="text-5xl font-bold mb-2">12min</div>
                <div className="text-lg text-blue-100">Average time to proposal</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">92%</div>
                <div className="text-lg text-blue-100">Win rate improvement</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">142</div>
                <div className="text-lg text-blue-100">SAP modules supported</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-light text-gray-900 mb-6">
            Ready to win more deals?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Start creating winning proposals in minutes, not weeks.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleStartProject}
              className="px-10 py-5 bg-blue-600 text-white text-lg font-semibold rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-105"
            >
              Start Your First Project
            </button>

            <button
              onClick={handleStartDemo}
              className="px-10 py-5 bg-white border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-full hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>© 2025 SAP Implementation Cockpit. Built with ❤️ for SAP consultants.</p>
        </div>
      </div>
    </div>
  );
}
