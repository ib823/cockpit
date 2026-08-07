/**
 * Design system showcase.
 *
 * Rewritten to render the new system rather than the old one. Its predecessor
 * showcased tokens that are being replaced, which made it a reference to the
 * thing being removed.
 *
 * This page renders real components, not swatches of markup that look like
 * them. That distinction matters: the previous accessibility evidence was
 * written against hand-authored HTML, which is how BaseModal came to ship with
 * no dialog role while its documentation said otherwise. If a control is shown
 * here, it is the same component the app uses.
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Textarea } from "@/components/ds/Textarea";
import { NumberInput } from "@/components/ds/NumberInput";
import { SearchInput } from "@/components/ds/SearchInput";
import { Select } from "@/components/ds/Select";
import { Checkbox, Radio, Toggle, ChoiceGroup } from "@/components/ds/Choice";
import {
  StatusPill,
  Badge,
  Chip,
  Avatar,
  Progress,
  Skeleton,
} from "@/components/ds/Display";
import { Banner } from "@/components/ds/Banner";
import { EmptyState } from "@/components/ds/Feedback";
import { Modal, Drawer } from "@/components/ds/Modal";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import dynamic from "next/dynamic";
import { AllocationCell } from "@/components/ds/gantt/AllocationCell";
import { initialExpanded, type GanttPhase } from "@/components/ds/gantt/rows";
import type { ZoomGrain } from "@/components/ds/gantt/scale";

// Loaded lazily, and this is not a showcase convenience — it is how the canvas
// must be loaded everywhere. Importing it statically here put the whole Gantt
// module into the chunk this page shares with every other design-system route,
// so /settings — a redirect page — went from 16kB to 71kB of route JS. A
// timeline canvas belongs in its own chunk, fetched by the routes that draw a
// timeline.
const GanttCanvas = dynamic(
  () => import("@/components/ds/gantt/GanttCanvas").then((m) => m.GanttCanvas),
  { ssr: false, loading: () => <Skeleton width="100%" height={340} /> }
);
import styles from "./design.module.css";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section aria-labelledby={id} className={styles.section}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      {note && <p className={styles.sectionNote}>{note}</p>}
      <Card>
        <div className={styles.row}>{children}</div>
      </Card>
    </section>
  );
}

const SURFACES = ["base", "raised", "app", "sunken"] as const;
const CONTENT = ["primary", "secondary", "tertiary", "disabled"] as const;
const SEMANTIC = ["accent", "success", "warning", "danger", "info"] as const;

const DEMO_PHASES: GanttPhase[] = [
  { id: "prepare", name: "Prepare", tasks: [
    { id: "t1", name: "Project charter" },
    { id: "t2", name: "Kick-off workshop" },
  ]},
  { id: "explore", name: "Explore", tasks: [
    { id: "t3", name: "Fit-gap — Finance" },
    { id: "t4", name: "Fit-gap — Logistics" },
    { id: "t5", name: "Chart of accounts workshop" },
  ]},
  { id: "realize", name: "Realize", tasks: [
    { id: "t6", name: "Build — Finance" },
    { id: "t7", name: "Unit test — Finance" },
    { id: "t8", name: "Sign-off" },
  ]},
];

const DEMO_PLACEMENTS = {
  prepare: { startDay: 0, durationDays: 60, progress: 100 },
  t1: { startDay: 0, durationDays: 14, progress: 100 },
  t2: { startDay: 14, durationDays: 3, progress: 100 },
  explore: { startDay: 48, durationDays: 138, progress: 70 },
  t3: { startDay: 48, durationDays: 30, progress: 100 },
  t4: { startDay: 60, durationDays: 30, progress: 60 },
  t5: { startDay: 90, durationDays: 21, progress: 10, critical: true },
  realize: { startDay: 160, durationDays: 292, progress: 20 },
  t6: { startDay: 160, durationDays: 60, progress: 35, baselineStartDay: 150, baselineDurationDays: 60 },
  t7: { startDay: 220, durationDays: 30, progress: 0 },
  t8: { startDay: 250, durationDays: 1, progress: 0 },
};

const DEMO_ALLOCATIONS = [0, 40, 65, 80, 95, 100, 120, 140];

export default function DesignShowcasePage() {
  const [ganttGrain, setGanttGrain] = useState<ZoomGrain>("Week");
  const [ganttExpanded, setGanttExpanded] = useState<Set<string>>(() =>
    initialExpanded(DEMO_PHASES)
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState(false);

  return (
    <AppShell brand="Design system">
      <PageHeader
        title="Design system"
        description="Live components, not screenshots. Switch your OS or browser theme to see both palettes — every colour below is a token, so nothing here is hard-coded."
      />

      <Section
        title="Surfaces"
        note="raised equals base in light; only dark separates them."
      >
        {SURFACES.map((name) => (
          <div key={name} className={styles.swatch}>
            <span
              className={styles.swatchChip}
              style={{ background: `var(--ds-surface-${name})` }}
            />
            <code>surface/{name}</code>
          </div>
        ))}
      </Section>

      <Section
        title="Content"
        note="content/disabled is the one documented contrast exemption, and is always paired with aria-disabled."
      >
        {CONTENT.map((name) => (
          <p key={name} style={{ color: `var(--ds-content-${name})`, margin: 0 }}>
            content/{name} — the figure is the interface
          </p>
        ))}
      </Section>

      <Section title="Semantic colour">
        {SEMANTIC.map((name) => (
          <div key={name} className={styles.swatch}>
            <span
              className={styles.swatchChip}
              style={{ background: `var(--ds-${name}-default)` }}
            />
            <code>{name}</code>
          </div>
        ))}
      </Section>

      <Section title="Typography">
        <div className={styles.stack}>
          <p style={{ font: "var(--ds-type-display)", letterSpacing: "var(--ds-ls-display)", margin: 0 }}>
            Display — portfolio overview
          </p>
          <p style={{ font: "var(--ds-type-heading-lg)", margin: 0 }}>Heading lg — phase plan</p>
          <p style={{ font: "var(--ds-type-heading-md)", margin: 0 }}>Heading md — resource allocation</p>
          <p style={{ font: "var(--ds-type-body)", margin: 0 }}>
            Body — realization begins once the Explore sign-off is recorded.
          </p>
          <p className="ds-numeric" style={{ margin: 0, textAlign: "left" }}>
            Numeric — EUR 1,248,900.00 · 87.5% · 14 Sep 2026
          </p>
          <p style={{ font: "var(--ds-type-mono)", margin: 0 }}>Mono — PRJ-2291 · ⌘K · b8f21c</p>
        </div>
      </Section>

      <Section title="Buttons" note="Loading locks the width, so the row cannot reflow.">
        <Button variant="primary">Save plan</Button>
        <Button variant="secondary">Add phase</Button>
        <Button variant="tertiary">Compare</Button>
        <Button variant="ghost">Filter</Button>
        <Button variant="danger">Delete phase</Button>
        <Button variant="primary" loading loadingLabel="Saving…">
          Save plan
        </Button>
        <Button variant="primary" disabled>
          Unavailable
        </Button>
        <Button variant="secondary" menu>
          Menu
        </Button>
      </Section>

      <Section title="Fields">
        <div className={styles.grid}>
          <Input label="Task name" placeholder="e.g. Chart of accounts workshop" helper="Shown in the Gantt tree." />
          <Input label="Task name" error="Task name is required." placeholder="e.g. Chart of accounts workshop" />
          <Input label="Day rate" prefix="MYR" defaultValue="2,400" />
          <Input label="Baseline date" readOnly defaultValue="14 Sep 2026" helper="Set by the baseline." />
          <NumberInput label="Allocation" defaultValue={80} suffix="%" step={5} />
          <SearchInput label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} />
          <Select label="Region" defaultValue="emea">
            <option value="emea">EMEA</option>
            <option value="apac">APAC</option>
          </Select>
          <Textarea label="Notes" placeholder="Optional" />
        </div>
      </Section>

      <Section title="Choice controls">
        <div className={styles.stack}>
          <Checkbox label="Include weekends" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <Checkbox label="Select all" indeterminate description="3 of 12 tasks selected" readOnly />
          <Toggle label="Email notifications" defaultChecked />
          <Toggle label="Auto-sync" pending defaultChecked description="Waiting for the server to confirm" />
          <ChoiceGroup legend="Pricing model" orientation="horizontal">
            <Radio name="demo-pricing" label="Fixed price" defaultChecked />
            <Radio name="demo-pricing" label="Time and materials" />
          </ChoiceGroup>
        </div>
      </Section>

      <Section title="Status" note="Every pill carries a glyph and a word, so it survives a projector or a monochrome print.">
        <StatusPill tone="success">On track</StatusPill>
        <StatusPill tone="warning">At risk</StatusPill>
        <StatusPill tone="danger">Late</StatusPill>
        <StatusPill tone="info">Baseline</StatusPill>
        <StatusPill tone="neutral">Not started</StatusPill>
        <Badge count={3} label="pending approvals" />
        <Badge count={250} label="notifications" tone="danger" />
        <Chip onRemove={() => {}} removeLabel="EMEA">
          EMEA
        </Chip>
        <Avatar name="Ada Lovelace" />
      </Section>

      <Section title="Progress" note="The figure is printed; over 100% adds a hatch rather than only turning red.">
        <div className={styles.stack}>
          <Progress value={62} label="Realize phase" />
          <Progress value={94} label="Explore phase" tone="success" />
          <Progress value={120} label="Consultant A allocation" />
        </div>
      </Section>

      <Section title="Banners">
        <div className={styles.stack}>
          <Banner tone="info" title="You are viewing a baseline">Edits are disabled while a baseline is shown.</Banner>
          <Banner tone="success" title="Plan saved" />
          <Banner tone="warning" title="Two resources are over-allocated in week 32" />
          <Banner tone="danger" title="Sync failed">148 changes are queued locally and safe.</Banner>
        </div>
      </Section>

      <Section title="Empty states" note="Four designs, because they say four different things.">
        <div className={styles.stack}>
          <EmptyState
            kind="first-run"
            title="Build the timeline"
            body="Start with the five SAP Activate phases, or import a plan you already have."
            primaryAction={<Button variant="primary">Add the Activate phases</Button>}
          />
          <EmptyState
            kind="error"
            title="The plan could not be loaded"
            body="The server did not respond within 30 seconds. Your local copy is intact and 148 queued changes are safe."
            reference="PRJ-2291 / 14:32"
            primaryAction={<Button variant="primary">Try again</Button>}
          />
        </div>
      </Section>

      <Section title="Overlays">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open drawer
        </Button>
      </Section>

      <Section
        title="Gantt canvas"
        note="Layer 4. Click into it, then use ↑↓ to move the cursor, ←→ to expand a phase, M for Move mode, Space to select, +/− to zoom. Announcements are shown below the canvas; in the product that region is visually hidden."
      >
        <div style={{ width: "100%" }}>
          <GanttCanvas
            phases={DEMO_PHASES}
            placements={DEMO_PLACEMENTS}
            formatDay={(d) => {
              const date = new Date(2026, 0, 5 + d);
              return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "2-digit",
              });
            }}
            totalDays={460}
            grain={ganttGrain}
            onGrainChange={setGanttGrain}
            expandedIds={ganttExpanded}
            onExpandedChange={setGanttExpanded}
            majorTicks={[
              { day: 0, label: "Q1 2026" },
              { day: 90, label: "Q2 2026" },
              { day: 181, label: "Q3 2026" },
              { day: 273, label: "Q4 2026" },
              { day: 365, label: "Q1 2027" },
            ]}
            nonWorkingDays={[{ day: 25, name: "Thaipusam (MY)" }, { day: 48, name: "Chinese New Year" }]}
            todayDay={120}
            height={340}
            debugAnnouncements
          />
        </div>
      </Section>

      <Section
        title="Allocation heat"
        note="Figure, fill and — above 100% — a diagonal hatch. Three channels, so it survives a projector and a monochrome print."
      >
        {DEMO_ALLOCATIONS.map((value) => (
          <AllocationCell key={value} value={value} label={`Consultant, week ${value}`} />
        ))}
        <AllocationCell
          value={80}
          label="Consultant, week 33"
          redactedReason="Needs cost visibility level 2."
        />
      </Section>

      <Section title="Loading">
        <div className={styles.stack}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton width="100%" height={64} />
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete phase"
        description="This removes Realize and its 24 tasks."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Delete phase
            </Button>
          </>
        }
      >
        <Input label="Type the phase name to confirm" placeholder="Realize" />
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Task details">
        <Input label="Task name" defaultValue="Chart of accounts workshop" />
      </Drawer>
    </AppShell>
  );
}
