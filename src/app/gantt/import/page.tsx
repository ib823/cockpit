"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { parseTabular } from "@/lib/excelPaste";
import { parseTasksSection, parseResourcesSection } from "@/lib/pilotImport";
import { validateAllocationsAgainstCatalog } from "@/lib/resourceCatalog";

export default function GanttImportPage() {
  const router = useRouter();
  const [rawTasks, setRawTasks] = useState("");
  const [rawResources, setRawResources] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState<"A" | "B">("A");

  // After section A
  const [tasks, setTasks] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [activeByWeek, setActiveByWeek] = useState<Record<number, string>>({});

  const parseA = () => {
    try {
      setErrorMsg("");
      const tbl = parseTabular(rawTasks);
      const out = parseTasksSection(tbl);
      setTasks(out.tasks);
      setWeeks(out.weeks);
      setActiveByWeek(out.activeByWeek);
      setStep("B");
    } catch (err: any) {
      setErrorMsg("Section A error: " + err.message);
    }
  };

  const parseB = () => {
    try {
      setErrorMsg("");
      const tbl = parseTabular(rawResources);
      const map = {
        role: "Role",
        rank: "Rank",
        company: "Company",
        resourceName: "Resource Name",
        start: "Start Date",
        end: "End Date",
        total: "Total",
      };
      const allocs = parseResourcesSection(tbl, map, weeks, activeByWeek, true);
      // VALIDATE against catalog – hard fail
      const validated = validateAllocationsAgainstCatalog(allocs, activeByWeek);
      // Store everything
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gantt_tasks", JSON.stringify(tasks));
        sessionStorage.setItem("gantt_weeks", JSON.stringify(weeks));
        sessionStorage.setItem("gantt_allocations", JSON.stringify(validated));
        sessionStorage.setItem("gantt_activeByWeek", JSON.stringify(activeByWeek));
      }
      router.push("/gantt");
    } catch (err: any) {
      setErrorMsg("Section B error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Gantt Import</h1>
      {errorMsg && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: 4,
            color: "#c00",
          }}
        >
          {errorMsg}
        </div>
      )}

      {step === "A" && (
        <div>
          <h2>Section A: Tasks</h2>
          <p>
            Paste TSV or CSV with columns: <code>Task Name</code>, <code>Start</code>,{" "}
            <code>End</code>, <code>Duration</code>, and <code>W1, W2, W3...</code> (flag with X or
            1).
          </p>
          <textarea
            value={rawTasks}
            onChange={(e) => setRawTasks(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 13,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
            placeholder="Task Name	Start	End	Duration	W1	W2	W3..."
          />
          <div style={{ marginTop: 16 }}>
            <button
              onClick={parseA}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 4,
              }}
            >
              Parse Section A
            </button>
          </div>
        </div>
      )}

      {step === "B" && (
        <div>
          <h2>Section B: Resources</h2>
          <p>
            Paste TSV or CSV with columns: <code>Role</code>, <code>Rank</code>,{" "}
            <code>Company</code>, <code>Resource Name</code>, <code>Start Date</code>,{" "}
            <code>End Date</code>, <code>Total</code>, and <code>W1, W2, W3...</code> (mandays).
          </p>
          <textarea
            value={rawResources}
            onChange={(e) => setRawResources(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 13,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
            placeholder="Role	Rank	Company	Resource Name	Start Date	End Date	Total	W1	W2	W3..."
          />
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              onClick={() => setStep("A")}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
                background: "#666",
                color: "#fff",
                border: "none",
                borderRadius: 4,
              }}
            >
              Back
            </button>
            <button
              onClick={parseB}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 4,
              }}
            >
              Import & Validate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
