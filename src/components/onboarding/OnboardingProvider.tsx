"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "right" | "bottom" | "left" | "center";
  action?: () => void; // Optional action to perform when step is shown
  mode?: "capture" | "decide" | "plan" | "present"; // Required mode for this step
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: OnboardingStep | null;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

const ONBOARDING_STORAGE_KEY = "cockpit_onboarding_completed";

// Onboarding steps definition
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Keystone! 👋",
    description: "Transform your SAP presales workflow from weeks to minutes. Let's take a quick tour of the 4-mode workflow.",
    position: "center",
  },
  {
    id: "capture-intro",
    title: "Mode 1: Capture Requirements",
    description: "Extract project details from RFPs automatically. Paste text, upload documents, or manually add requirements as 'chips'.",
    mode: "capture",
    position: "center",
  },
  {
    id: "capture-chips",
    title: "Understanding Chips",
    description: "Each requirement is a 'chip' - a piece of structured data extracted from your RFP (country, industry, modules, etc.)",
    mode: "capture",
    position: "center",
  },
  {
    id: "capture-completeness",
    title: "Completeness Score",
    description: "Track your progress with the completeness indicator. Reach 65% to unlock the next mode!",
    mode: "capture",
    position: "center",
  },
  {
    id: "decide-intro",
    title: "Mode 2: Make Key Decisions",
    description: "Make 5 strategic decisions that shape your project: module combo, pricing, SSO, deployment, and compliance.",
    mode: "decide",
    position: "center",
  },
  {
    id: "decide-cards",
    title: "Decision Cards",
    description: "Each card represents a critical decision. Choose the option that best fits your project requirements.",
    mode: "decide",
    position: "center",
  },
  {
    id: "plan-intro",
    title: "Mode 3: Plan Timeline",
    description: "Generate a complete project timeline with phases, resources, and cost estimates based on your requirements and decisions.",
    mode: "plan",
    position: "center",
  },
  {
    id: "plan-gantt",
    title: "Interactive Timeline",
    description: "View and edit your project phases in the Gantt chart. Click any phase to view details and make adjustments.",
    mode: "plan",
    position: "center",
  },
  {
    id: "plan-tabs",
    title: "Multiple Views",
    description: "Switch between Timeline, Benchmarks, Resources, and RICEFW tabs to explore different aspects of your project plan.",
    mode: "plan",
    position: "center",
  },
  {
    id: "present-intro",
    title: "Mode 4: Present",
    description: "Transform your plan into a client-ready presentation with full-screen slides and presenter notes.",
    mode: "present",
    position: "center",
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    description: "That's the complete workflow! Start by capturing requirements from your next RFP. You can replay this tour anytime from the settings menu.",
    position: "center",
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);

  // Check if user has completed onboarding before
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    setHasCompletedBefore(completed === "true");

    // Auto-start onboarding for first-time users after a short delay
    if (!completed) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const skipOnboarding = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasCompletedBefore(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasCompletedBefore(true);
  }, []);

  const value: OnboardingContextValue = {
    isActive,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    currentStepData: isActive ? ONBOARDING_STEPS[currentStep] : null,
    startOnboarding,
    skipOnboarding,
    nextStep,
    prevStep,
    completeOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}