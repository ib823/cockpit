"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { Button } from "@/components/ds/Button";
import { Banner } from "@/components/ds/Banner";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import { adminNav } from "../nav";
import styles from "../admin.module.css";

type Row = {
  email: string;
  status: "pending" | "approved" | "enrolled" | "expired";
  exception: boolean;
  expiry: string | null;
  codeActive: boolean;
  loginCount: number;
  lastLoginAt?: string | null;
  timelineRuns: number;
  lastTimelineAt?: string | null;
};

export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [kpi, setKpi] = useState<{
    users: number;
    active: number;
    logins24h: number;
    timelines24h: number;
  }>();
  // The re-approve response contains a one-time access code. It used to be
  // shown for three seconds and then vanish, which is not long enough to read,
  // copy and paste a credential the user gets exactly one chance at. It now
  // stays until dismissed.
  const [code, setCode] = useState<{ email: string; value: string } | null>(null);

  async function refresh() {
    const [a, b] = await Promise.all([
      fetch("/api/admin/approvals").then((r) => r.json()),
      fetch("/api/admin/audit").then((r) => r.json()),
    ]);
    setRows(a.rows);
    setKpi(b);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function approve(email: string) {
    const r = await fetch("/api/admin/approvals", {
      method: "POST",
      body: JSON.stringify({ email }),
    }).then((r) => r.json());
    setCode({ email, value: r.code });
    refresh();
  }
  async function toggleException(email: string) {
    await fetch("/api/admin/approvals", {
      method: "PATCH",
      body: JSON.stringify({ email, action: "toggle-exception" }),
    });
    refresh();
  }
  async function disable(email: string) {
    await fetch("/api/admin/approvals", {
      method: "PATCH",
      body: JSON.stringify({ email, action: "disable" }),
    });
    refresh();
  }
  async function reapprove(email: string) {
    const r = await fetch("/api/admin/approvals", {
      method: "PATCH",
      body: JSON.stringify({ email, action: "reapprove" }),
    }).then((r) => r.json());
    setCode({ email, value: r.code });
    refresh();
  }

  const columns: Column<Row>[] = [
    { key: "email", header: "Email", render: (r) => r.email },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill
          tone={
            r.status === "enrolled"
              ? "success"
              : r.status === "approved"
                ? "info"
                : r.status === "expired"
                  ? "danger"
                  : "warning"
          }
        >
          {r.status}
        </StatusPill>
      ),
    },
    {
      key: "exception",
      header: "Exception",
      render: (r) => (
        <Button
          size="sm"
          variant={r.exception ? "secondary" : "ghost"}
          aria-pressed={r.exception}
          aria-label={`Exception ${r.exception ? "enabled" : "disabled"} for ${r.email}`}
          onClick={() => toggleException(r.email)}
        >
          {r.exception ? "Enabled" : "Disabled"}
        </Button>
      ),
    },
    {
      key: "expiry",
      header: "Expires",
      render: (r) => (r.expiry ? new Date(r.expiry).toLocaleString() : "—"),
    },
    { key: "loginCount", header: "Logins", numeric: true, render: (r) => r.loginCount },
    {
      key: "lastLoginAt",
      header: "Last login",
      render: (r) => (r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : "—"),
    },
    {
      key: "timelineRuns",
      header: "Timelines",
      numeric: true,
      render: (r) => r.timelineRuns,
    },
    {
      key: "lastTimelineAt",
      header: "Last timeline",
      render: (r) => (r.lastTimelineAt ? new Date(r.lastTimelineAt).toLocaleString() : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--ds-space-2)" }}>
          {r.status === "pending" && (
            <Button size="sm" variant="primary" onClick={() => approve(r.email)}>
              Approve
            </Button>
          )}
          {r.status === "approved" && (
            <Button size="sm" variant="secondary" onClick={() => reapprove(r.email)}>
              Re-approve
            </Button>
          )}
          {r.status === "enrolled" && (
            <Button size="sm" variant="danger" onClick={() => disable(r.email)}>
              Disable
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = kpi
    ? [
        { label: "Users", value: kpi.users },
        { label: "Active", value: kpi.active },
        { label: "Logins (24h)", value: kpi.logins24h },
        { label: "Timelines (24h)", value: kpi.timelines24h },
      ]
    : [];

  return (
    <AppShell brand="Admin" primaryNav={adminNav("/admin/approvals")}>
      <PageHeader
        title="Approvals and audit"
        description="Access status, exceptions and activity for every non-admin user."
      />

      {code && (
        <div style={{ marginBottom: "var(--ds-space-5)" }}>
          <Banner
            tone="success"
            title={`Access code for ${code.email}`}
            onDismiss={() => setCode(null)}
          >
            <span style={{ font: "var(--ds-type-mono)", fontSize: 18 }}>{code.value}</span>
            <br />
            Share this once. It is not shown again after you dismiss this message.
          </Banner>
        </div>
      )}

      {stats.length > 0 && (
        <div className={styles.statGrid}>
          {stats.map((s) => (
            <Card key={s.label}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value.toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}

      <Card padded={false}>
        <DataTable
          caption="User approvals and audit data"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.email}
          emptyState={
            <EmptyState
              kind="no-results"
              title="No users yet"
              body="Approved and enrolled users appear here once they exist."
            />
          }
        />
      </Card>
    </AppShell>
  );
}
