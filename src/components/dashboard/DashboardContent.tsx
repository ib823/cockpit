'use client';

import { motion } from 'framer-motion';
import {
  Calculator,
  Calendar,
  FileText,
  Users,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Settings,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LogoutButton } from '@/components/common/LogoutButton';
import type { Session } from 'next-auth';

interface DashboardContentProps {
  session: Session;
}

export function DashboardContent({ session }: DashboardContentProps) {
  const router = useRouter();
  const isAdmin = session.user.role === 'ADMIN';

  const quickActions = [
    {
      title: 'Quick Estimate',
      description: 'Start a new SAP implementation estimate',
      icon: Calculator,
      href: '/estimator',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      title: 'Timeline Planner',
      description: 'Create and manage project timelines',
      icon: Calendar,
      href: '/timeline',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      title: 'Project Manager',
      description: 'View and manage all projects',
      icon: FileText,
      href: '/project',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    },
  ];

  const stats = [
    {
      label: 'Projects',
      value: '12',
      change: '+3 this month',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Estimates',
      value: '45',
      change: '+8 this week',
      icon: Calculator,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Avg. Accuracy',
      value: '92%',
      change: '+5% vs last quarter',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Time Saved',
      value: '48h',
      change: 'This month',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const recentActivity = [
    {
      title: 'Manufacturing Implementation Estimate',
      time: '2 hours ago',
      status: 'completed',
      icon: CheckCircle,
    },
    {
      title: 'Q2 Timeline Planning',
      time: '5 hours ago',
      status: 'in-progress',
      icon: Clock,
    },
    {
      title: 'Finance Module Scope Review',
      time: 'Yesterday',
      status: 'completed',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SAP Cockpit</h1>
                <p className="text-sm text-gray-600">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </button>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className="text-xs text-green-600 font-medium">{stat.change}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(action.href)}
                className={`group relative bg-gradient-to-br ${action.color} ${action.hoverColor} text-white rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-xl overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
                <action.icon className="w-8 h-8 mb-4 opacity-90" />
                <h4 className="font-bold text-lg mb-2">{action.title}</h4>
                <p className="text-sm opacity-90 mb-4">{action.description}</p>
                <div className="flex items-center text-sm font-medium">
                  <span>Start now</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.time}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resources</h3>
            <div className="space-y-3">
              <a
                href="/estimator"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Estimator Guide</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </a>
              <a
                href="/timeline"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Team Resources</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </a>
              <a
                href="/project"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Documentation</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </a>
            </div>

            {/* Tips Section */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Pro Tip</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Use the Quick Estimate feature to generate proposals in under 10 minutes. Try
                    it now!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
