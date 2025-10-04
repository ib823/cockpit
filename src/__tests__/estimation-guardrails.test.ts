// src/__tests__/estimation-guardrails.test.ts
import { describe, it, expect } from "vitest";
import { validateEstimation, getPlanSummary } from "@/lib/estimation-guardrails";
import { ScenarioPlan } from "@/types/core";

describe("Estimation Guardrails", () => {
  it("passes validation for good plan", () => {
    const goodPlan: ScenarioPlan = {
      id: "test",
      name: "Test Plan",
      totalEffort: 400,
      totalCost: 1000000,
      duration: 160, // 8 months
      phases: [
        {
          id: "1",
          name: "Realize - Configuration",
          category: "Realize",
          startBusinessDay: 0,
          workingDays: 40,
          effort: 180,
          resources: [
            { id: "r1", role: "Consultant", allocation: 1, region: "ABMY", hourlyRate: 100 },
          ],
        },
        {
          id: "2",
          name: "Explore - Configuration",
          category: "Explore",
          startBusinessDay: 0,
          workingDays: 20,
          effort: 80,
          resources: [
            { id: "r2", role: "Consultant", allocation: 1, region: "ABMY", hourlyRate: 100 },
          ],
        },
        {
          id: "3",
          name: "Deploy - Configuration",
          category: "Deploy",
          startBusinessDay: 60,
          workingDays: 30,
          effort: 80,
          resources: [],
        },
        {
          id: "4",
          name: "Prepare - Configuration",
          category: "Prepare",
          startBusinessDay: 0,
          workingDays: 10,
          effort: 20,
          resources: [],
        },
        {
          id: "5",
          name: "Run - Configuration",
          category: "Run",
          startBusinessDay: 100,
          workingDays: 20,
          effort: 40,
          resources: [],
        },
      ],
      assumptions: ["Test assumption"],
      risks: ["Test risk"],
      confidence: 0.8,
    };

    const violations = validateEstimation(goodPlan);
    const errors = violations.filter((v) => v.level === "error");

    expect(errors.length).toBe(0);
  });

  it("detects zero effort error", () => {
    const badPlan: ScenarioPlan = {
      id: "test",
      name: "Bad Plan",
      totalEffort: 0,
      totalCost: 0,
      duration: 120,
      phases: [],
      assumptions: [],
      risks: [],
      confidence: 0,
    };

    const violations = validateEstimation(badPlan);
    const errors = violations.filter((v) => v.level === "error");

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((v) => v.message.includes("effort is zero"))).toBe(true);
  });

  it("detects too-aggressive timeline", () => {
    const rushPlan: ScenarioPlan = {
      id: "test",
      name: "Rush Plan",
      totalEffort: 400,
      totalCost: 1000000,
      duration: 40, // Only 2 months!
      phases: [
        {
          id: "1",
          name: "Realize - Configuration",
          category: "Realize",
          startBusinessDay: 0,
          workingDays: 40,
          effort: 400,
          resources: [],
        },
      ],
      assumptions: [],
      risks: [],
      confidence: 0.5,
    };

    const violations = validateEstimation(rushPlan);
    const errors = violations.filter((v) => v.level === "error");

    expect(errors.some((v) => v.message.includes("too aggressive"))).toBe(true);
  });

  it("calculates plan summary correctly", () => {
    const plan: ScenarioPlan = {
      id: "test",
      name: "Test",
      totalEffort: 400,
      totalCost: 1000000,
      duration: 160, // 8 months
      phases: [
        {
          id: "1",
          name: "Realize - Config",
          category: "Realize",
          startBusinessDay: 0,
          workingDays: 40,
          effort: 200,
          resources: [],
        },
        {
          id: "2",
          name: "Explore - Config",
          category: "Explore",
          startBusinessDay: 0,
          workingDays: 20,
          effort: 100,
          resources: [],
        },
        {
          id: "3",
          name: "Deploy - Config",
          category: "Deploy",
          startBusinessDay: 60,
          workingDays: 30,
          effort: 100,
          resources: [],
        },
      ],
      assumptions: [],
      risks: [],
      confidence: 0.8,
    };

    const summary = getPlanSummary(plan);

    expect(summary.totalEffort).toBe(400);
    expect(summary.totalCost).toBe(1000000);
    expect(summary.durationMonths).toBe(8);
    expect(summary.avgFTE).toBe(50); // 400 PD / 8 months = 50 PD/month
    expect(summary.costPerPD).toBe(2500); // 1M / 400 PD
    expect(summary.realizePct).toBe(50); // 200/400
  });
});
