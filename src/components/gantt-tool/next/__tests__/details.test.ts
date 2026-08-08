/**
 * The detail columns are parity surface: whatever these produce is what sits
 * beside the legacy canvas's numbers when the two are compared on one plan.
 * So the assertions here are against legacy's exact output formats — "3.2 m",
 * "42 d", "05-Jan-26 (Mon) - 30-Jan-26 (Fri)" — not paraphrases of them.
 */

import { describe, expect, it } from "vitest";
import type { GanttPhase, GanttTask } from "@/types/gantt-tool";
import { buildRowDetails } from "../details";

function task(over: Partial<GanttTask> & Pick<GanttTask, "id" | "startDate" | "endDate">): GanttTask {
  return {
    phaseId: "p1",
    name: over.id,
    dependencies: [],
    progress: 0,
    order: 0,
    level: 0,
    collapsed: false,
    isParent: false,
    ...over,
  } as GanttTask;
}

function phase(over: Partial<GanttPhase> & Pick<GanttPhase, "id" | "startDate" | "endDate">): GanttPhase {
  return {
    name: over.id,
    color: "#0B57D0",
    tasks: [],
    collapsed: false,
    dependencies: [],
    order: 0,
    ...over,
  } as GanttPhase;
}

describe("buildRowDetails", () => {
  it("renders legacy's formats exactly, for phases and tasks alike", () => {
    // Mon 5 Jan – Fri 30 Jan 2026: 26 calendar days, 20 working days,
    // no holidays involved.
    const details = buildRowDetails(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [task({ id: "t1", startDate: "2026-01-05", endDate: "2026-01-09" })],
        }),
      ],
      []
    );

    expect(details.p1).toEqual({
      calendar: "0.9 m", // 26 / 30, rounded to 1dp — legacy's formatCalendarDaysAsMonths
      working: "20 d",
      dates: "05-Jan-26 (Mon) - 30-Jan-26 (Fri)",
      workingDays: 20,
    });
    expect(details.t1.working).toBe("5 d");
  });

  it("subtracts a weekday holiday from working days but not calendar days", () => {
    // Same task with a holiday on Wed 7 Jan: 5 calendar weekdays, 4 working.
    const withHoliday = buildRowDetails(
      [phase({ id: "p1", startDate: "2026-01-05", endDate: "2026-01-09" })],
      [{ id: "h", name: "Founders Day", date: "2026-01-07", region: "ABMY", type: "company" }]
    );
    const without = buildRowDetails(
      [phase({ id: "p1", startDate: "2026-01-05", endDate: "2026-01-09" })],
      []
    );

    expect(without.p1.workingDays).toBe(5);
    expect(withHoliday.p1.workingDays).toBe(4);
    // The calendar column is holiday-blind on purpose; only working days move.
    expect(withHoliday.p1.calendar).toBe(without.p1.calendar);
  });

  it("computes AMS rows uniformly — the cell describes the contract", () => {
    // The TIMELINE excludes AMS ends so the canvas does not stretch; the grid
    // still reports the contract's real duration, exactly as legacy does.
    const details = buildRowDetails(
      [phase({ id: "ams", phaseType: "ams", startDate: "2026-03-02", endDate: "2027-03-01" })],
      []
    );

    expect(details.ams.workingDays).toBeGreaterThan(250);
    expect(details.ams.calendar).toBe("12.2 m");
  });

  it("covers every row it is given and nothing else", () => {
    const details = buildRowDetails(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [
            task({ id: "t1", startDate: "2026-01-05", endDate: "2026-01-09" }),
            task({ id: "t2", startDate: "2026-01-12", endDate: "2026-01-16" }),
          ],
        }),
      ],
      []
    );

    expect(Object.keys(details).sort()).toEqual(["p1", "t1", "t2"]);
  });
});
