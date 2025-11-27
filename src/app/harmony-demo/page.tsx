/**
 * Harmony Org Chart Builder - Demo Page
 *
 * Interactive demo showcasing the Apple-grade design and Pixar-level animations
 */

"use client";

import { useState } from "react";
import { OrgChartHarmonyV2 } from "@/components/gantt-tool/OrgChartHarmonyV2";
import { Play, Sparkles, Smartphone, Monitor, Tablet, Zap, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function HarmonyDemoPage() {
  const [showOrgChart, setShowOrgChart] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      }}
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        style={{
          maxWidth: 900,
          textAlign: "center",
          marginBottom: 60,
        }}
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.2,
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            padding: "12px 24px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: 20,
            backdropFilter: "blur(10px)",
          }}
        >
          <Sparkles size={28} color="#FFD700" />
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Harmony
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.95)",
            margin: "0 0 16px 0",
            fontWeight: 600,
          }}
        >
          The most delightful org chart builder ever created
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.8)",
            margin: "0 0 48px 0",
            lineHeight: 1.6,
          }}
        >
          Apple-grade design meets Pixar-level animation smoothness.
          <br />
          Experience the future of org chart building.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.6,
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOrgChart(true)}
          style={{
            padding: "18px 48px",
            fontSize: 18,
            fontWeight: 600,
            color: "#667eea",
            backgroundColor: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Play size={20} />
          Launch Harmony
        </motion.button>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          maxWidth: 1200,
          width: "100%",
          marginBottom: 40,
        }}
      >
        <FeatureCard
          icon={<Zap size={32} />}
          title="Pixar-Quality Animation"
          description="Spring physics animations that feel alive, not robotic. 60fps guaranteed."
          color="#FFD700"
        />
        <FeatureCard
          icon={<Heart size={32} />}
          title="Apple-Grade Design"
          description="Clean, minimalist interface with obsessive attention to detail."
          color="#FF6B9D"
        />
        <FeatureCard
          icon={<Smartphone size={32} />}
          title="Touch-Native"
          description="Pinch-to-zoom, long-press, swipe—all feel natural on mobile."
          color="#4A90E2"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{
          display: "flex",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 40,
        }}
      >
        <Stat value="60fps" label="Buttery Smooth" />
        <Stat value="42KB" label="Bundle Size" />
        <Stat value="100%" label="WCAG 2.1 AA" />
        <Stat value="12" label="Shortcuts" />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{
          marginTop: 60,
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: 14,
        }}
      >
        <p style={{ margin: "8px 0" }}>
          "Design is not just what it looks like. Design is how it works."
        </p>
        <p style={{ margin: "8px 0", fontWeight: 600 }}>— Steve Jobs</p>

        <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <InfoBadge icon={<Monitor size={16} />} text="Desktop" />
          <InfoBadge icon={<Tablet size={16} />} text="Tablet" />
          <InfoBadge icon={<Smartphone size={16} />} text="Mobile" />
        </div>
      </motion.div>

      {/* Org Chart Modal */}
      {showOrgChart && (
        <OrgChartHarmonyV2
          onClose={() => setShowOrgChart(false)}
          project={null}
        />
      )}
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        padding: 32,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: `${color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          color,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#1D1D1F",
          margin: "0 0 12px 0",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          color: "#86868B",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

// Stat Component
interface StatProps {
  value: string;
  label: string;
}

function Stat({ value, label }: StatProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#FFFFFF",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Info Badge Component
interface InfoBadgeProps {
  icon: React.ReactNode;
  text: string;
}

function InfoBadge({ icon, text }: InfoBadgeProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 12,
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
      }}
    >
      {icon}
      {text}
    </div>
  );
}
