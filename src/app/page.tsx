'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Clock, TrendingUp, Users, Zap, BarChart3, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LogoutButton } from "@/components/common/LogoutButton";
import { Spin } from 'antd';

/**
 * LANDING PAGE - Emotional First Impression
 *
 * UX Principles Applied:
 * 1. Peak-End Rule: Create emotional peaks (recognition → relief → excitement)
 * 2. Jobs-to-be-Done: Address functional + emotional + social jobs
 * 3. Progressive Disclosure: Show value before asking for commitment
 * 4. Fitts's Law: Large, thumb-friendly CTAs
 */

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showDemo, setShowDemo] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show landing page if redirecting
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">SAP Cockpit</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Login
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Hero Section - BEAT 1: RECOGNITION */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Headline - Outcome focused */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-blue-700 bg-clip-text text-transparent leading-tight">
            From RFP to Proposal
            <br />
            in 10 Minutes
          </h1>

          {/* Subhead - Acknowledge pain */}
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
            Not 10 hours. Not 10 spreadsheets.
            <br />
            <span className="text-gray-900 font-medium">Just 10 minutes of your time.</span>
          </p>

          {/* Primary CTA - No friction */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/estimator')}
              className="group px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
            >
              <Zap className="w-6 h-6" />
              <span>Try Quick Estimate</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDemo(true)}
              className="px-8 py-5 border-2 border-gray-300 text-gray-700 rounded-2xl text-lg font-medium hover:border-gray-400 hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              <span>Watch Demo</span>
              <span className="text-gray-400">2 min →</span>
            </motion.button>
          </div>

          {/* Microcopy - Build trust */}
          <p className="text-sm text-gray-500">
            No login required · No credit card · No commitment
          </p>

          {/* Social proof numbers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2,000+</div>
              <div className="text-sm text-gray-600">Proposals Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">Consultants</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Empathy Section - BEAT 2: RELIEF */}
      <section className="bg-white py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
              We know what you&apos;re going through
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every SAP presales consultant faces the same challenges.
              <br />
              We built this to solve them.
            </p>
          </motion.div>

          {/* Pain point cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Friday RFPs ruin weekends",
                description: "Client sends RFP at 4 PM Friday, wants proposal by Monday morning.",
                stat: "12+ hours lost",
                color: "from-red-500 to-orange-500"
              },
              {
                icon: TrendingUp,
                title: "Guessing effort is stressful",
                description: "Under-estimate by 40% and kill your margin. Over-estimate and lose the deal.",
                stat: "±30% variance",
                color: "from-orange-500 to-yellow-500"
              },
              {
                icon: Clock,
                title: "Clients expect proposals yesterday",
                description: "No time for proper analysis. Just spreadsheet panic and anxiety.",
                stat: "2-3 hours typical",
                color: "from-yellow-500 to-green-500"
              }
            ].map((pain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pain.color} flex items-center justify-center mb-6`}>
                  <pain.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{pain.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{pain.description}</p>
                <div className="text-sm font-semibold text-red-600">{pain.stat}</div>
              </motion.div>
            ))}
          </div>

          {/* Solution preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>All solved in under 10 minutes</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section - BEAT 3: EXCITEMENT */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
              Join 500+ consultants who&apos;ve
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                reclaimed their weekends
              </span>
            </h2>
          </motion.div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                quote: "I used to dread Friday RFPs. Now I knock them out in 10 minutes and my win rate is up 25%.",
                name: "Alex Chen",
                role: "Senior Presales Consultant",
                company: "SAP Partner APAC",
                avatar: "AC"
              },
              {
                quote: "My team's proposals are finally consistent. I can review in 5 minutes instead of 30.",
                name: "Sarah Johnson",
                role: "Sales Director",
                company: "Enterprise Solutions",
                avatar: "SJ"
              },
              {
                quote: "As a junior analyst, this taught me how to think like a senior consultant. Game changer.",
                name: "Nadia Rahman",
                role: "Presales Analyst",
                company: "Tech Consulting Group",
                avatar: "NR"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">&quot;{testimonial.quote}&quot;</p>
                <div className="text-sm text-gray-500">{testimonial.company}</div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-center text-white"
          >
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Clock, label: "Time Saved", value: "200+ hrs/year" },
                { icon: TrendingUp, label: "Win Rate Increase", value: "+15-20%" },
                { icon: CheckCircle, label: "Accuracy", value: "92% avg" },
                { icon: Users, label: "Happy Consultants", value: "500+" }
              ].map((stat, i) => (
                <div key={i}>
                  <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to reclaim your weekends?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ consultants who&apos;ve eliminated the Friday RFP nightmare
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/estimator')}
            className="px-10 py-6 bg-white text-gray-900 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
          >
            Start Your First Estimate →
          </motion.button>
          <p className="text-sm text-gray-400 mt-6">
            No credit card required · Free forever · 2 minute setup
          </p>
        </div>
      </section>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Product Demo</h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Demo video would play here</p>
                  <p className="text-sm text-gray-400 mt-2">(2 minute walkthrough)</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
