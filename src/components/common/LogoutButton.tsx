"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { animation } from "@/lib/design-system";

/**
 * LogoutButton - Clean, minimal logout with confirmation
 *
 * UI/UX Principles:
 * - Steve Jobs minimalism: Simple, clear, no clutter
 * - Confirmation dialog prevents accidental logouts
 * - Smooth animations for delight
 * - Responsive design (mobile-first)
 */
export function LogoutButton({ variant = "button", theme = "light" }: { variant?: "button" | "menu-item"; theme?: "light" | "dark" }) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        // API endpoint doesn't exist or returned error - fail silently
        return;
      }
      const data = await res.json();
      if (data.ok && data.user) {
        setCurrentUser({ email: data.user.email, name: data.user.name });
      }
    } catch (e) {
      // Network error or API doesn't exist - fail silently
      // Jobs + Ive: "It just works" - no error messages for missing features
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();

      if (data.ok) {
        // Clear any localStorage data
        localStorage.clear();

        // Redirect to login
        router.push('/login');
      } else {
        console.error('Logout failed:', data.error);
        setIsLoggingOut(false);
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowConfirmation(false);
    }
  };

  if (variant === "menu-item") {
    return (
      <>
        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

        <ConfirmationDialog
          isOpen={showConfirmation}
          isLoggingOut={isLoggingOut}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleLogout}
          currentUser={currentUser}
        />
      </>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setShowConfirmation(true)}
        className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
          isDark
            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }`}
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>

      {/* Current User Email - Under button */}
      {currentUser && (
        <p className={`text-xs hidden sm:block ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {currentUser.email}
        </p>
      )}

      <ConfirmationDialog
        isOpen={showConfirmation}
        isLoggingOut={isLoggingOut}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleLogout}
        currentUser={currentUser}
      />
    </div>
  );
}

function ConfirmationDialog({
  isOpen,
  isLoggingOut,
  onClose,
  onConfirm,
  currentUser,
}: {
  isOpen: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentUser: { email: string; name: string | null } | null;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Dialog - RESPONSIVE & MINIMAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: animation.duration.normal, ease: animation.easing.standard }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 w-[90vw] sm:w-[400px] max-w-md mx-4">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full mx-auto mb-4 sm:mb-5">
                <LogOut className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>

              {/* Content */}
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-2 sm:mb-4">
                {isLoggingOut ? "Logging out..." : "Logout?"}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
                {isLoggingOut
                  ? "Please wait while we sign you out."
                  : `Are you sure you want to logout${currentUser?.name ? `, ${currentUser.name}` : ''}?`
                }
              </p>

              {/* Actions */}
              {!isLoggingOut && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm sm:text-base"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Loading spinner */}
              {isLoggingOut && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
