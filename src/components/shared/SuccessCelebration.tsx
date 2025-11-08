/**
 * Success Celebration Component
 * Lightweight confetti animation for celebrating user accomplishments
 *
 * Features:
 * - Pure CSS/JS implementation (no dependencies)
 * - Customizable colors and duration
 * - Multiple celebration types (confetti, fireworks, subtle)
 * - Accessible (can be disabled via prefers-reduced-motion)
 * - Performance optimized with RAF
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';

interface SuccessCelebrationProps {
  /** Type of celebration animation */
  type?: 'confetti' | 'fireworks' | 'subtle';
  /** Duration in milliseconds */
  duration?: number;
  /** Custom message to display */
  message?: string;
  /** Callback when animation completes */
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#10b981', // green
  '#ef4444', // red
  '#ec4899', // pink
];

export function SuccessCelebration({
  type = 'confetti',
  duration = 3000,
  message,
  onComplete,
}: SuccessCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const animationFrameRef = useRef<number>();

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Create particles
  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    const particleCount = type === 'subtle' ? 30 : type === 'fireworks' ? 50 : 80;

    if (!canvasRef.current) return particles;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = type === 'subtle' ? 2 + Math.random() * 2 : 3 + Math.random() * 4;

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (type === 'confetti' ? 2 : 0),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: type === 'subtle' ? 3 + Math.random() * 3 : 5 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    return particles;
  }, [type]);

  // Animate particles
  const animate = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    const particles = particlesRef.current;
    let aliveCount = 0;

    particles.forEach((particle) => {
      if (particle.life <= 0) return;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Apply gravity
      particle.vy += 0.15;

      // Update rotation
      particle.rotation += particle.rotationSpeed;

      // Decrease life
      particle.life -= 0.01;

      if (particle.life > 0) {
        aliveCount++;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        if (type === 'confetti') {
          // Draw rectangular confetti
          ctx.fillStyle = particle.color;
          ctx.fillRect(
            -particle.size / 2,
            -particle.size,
            particle.size,
            particle.size * 2
          );
        } else {
          // Draw circular particles for other types
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    });

    // Continue animation if particles are alive
    if (aliveCount > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      setIsVisible(false);
      onComplete?.();
    }
  }, [type, onComplete]);

  // Initialize canvas and start animation
  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) {
      // If reduced motion, just show message briefly
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particlesRef.current = createParticles();

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [createParticles, animate, duration, onComplete, prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {/* Canvas for particles */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Success message */}
      {message && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            animation: prefersReducedMotion ? 'none' : 'successPulse 0.5s ease-out',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '24px 32px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CheckCircleOutlined
              style={{
                fontSize: '48px',
                color: '#10b981',
              }}
            />
            <div
              style={{
                className="text-lg",
                fontWeight: 600,
                color: '#111827',
              }}
            >
              {message}
            </div>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes successPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to trigger success celebrations
 * Provides simple API for celebrating user actions
 */
export function useSuccessCelebration() {
  const [celebration, setCelebration] = useState<{
    type: 'confetti' | 'fireworks' | 'subtle';
    message?: string;
  } | null>(null);

  const celebrate = useCallback(
    (message?: string, type: 'confetti' | 'fireworks' | 'subtle' = 'confetti') => {
      setCelebration({ type, message });
    },
    []
  );

  const reset = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    celebrate,
    reset,
    SuccessCelebrationComponent: celebration ? (
      <SuccessCelebration
        type={celebration.type}
        message={celebration.message}
        onComplete={reset}
      />
    ) : null,
  };
}

/**
 * Pre-configured celebration functions
 */
export const celebrations = {
  /** Celebrate saving a scenario/project */
  saved: (celebrate: ReturnType<typeof useSuccessCelebration>['celebrate']) => {
    celebrate('Saved successfully!', 'subtle');
  },

  /** Celebrate generating a timeline */
  timelineGenerated: (celebrate: ReturnType<typeof useSuccessCelebration>['celebrate']) => {
    celebrate('Timeline generated!', 'confetti');
  },

  /** Celebrate completing onboarding */
  onboardingComplete: (celebrate: ReturnType<typeof useSuccessCelebration>['celebrate']) => {
    celebrate('Welcome to Keystone!', 'fireworks');
  },

  /** Celebrate project creation */
  projectCreated: (celebrate: ReturnType<typeof useSuccessCelebration>['celebrate']) => {
    celebrate('Project created!', 'confetti');
  },

  /** Celebrate export success */
  exported: (celebrate: ReturnType<typeof useSuccessCelebration>['celebrate']) => {
    celebrate('Exported successfully!', 'subtle');
  },
};
