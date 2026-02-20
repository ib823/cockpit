"use client";

import { useEffect, useState } from "react";

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
  const [msg, setMsg] = useState("");

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
    setMsg(`Code: ${r.code} (share once)`);
    setTimeout(() => setMsg(""), 3000);
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
    setMsg(`Code: ${r.code} (share once)`);
    setTimeout(() => setMsg(""), 3000);
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">Admin · Approvals & Audit</h1>
      {kpi && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <K label="Users" v={kpi.users} />
          <K label="Active" v={kpi.active} />
          <K label="Logins (24h)" v={kpi.logins24h} />
          <K label="Timelines (24h)" v={kpi.timelines24h} />
        </div>
      )}

      <div className="relative mt-6 rounded-2xl border border-slate-200 bg-white/85 backdrop-blur p-4">
        {msg && (
          <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm text-slate-700">{msg}</p>
        )}
        <table className="w-full text-left text-sm">
          <caption className="sr-only">User approvals and audit data</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">Email</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Exception</th>
              <th scope="col" className="px-4 py-3">Expires</th>
              <th scope="col" className="px-4 py-3">Logins</th>
              <th scope="col" className="px-4 py-3">Last login</th>
              <th scope="col" className="px-4 py-3">Timelines</th>
              <th scope="col" className="px-4 py-3">Last timeline</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="px-4 py-3 font-medium text-slate-900">{r.email}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-medium ${r.exception ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                    onClick={() => toggleException(r.email)}
                    aria-pressed={r.exception}
                    aria-label={`Exception ${r.exception ? "enabled" : "disabled"} for ${r.email}`}
                  >
                    {r.exception ? "Enabled" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {r.expiry ? new Date(r.expiry).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">{r.loginCount}</td>
                <td className="px-4 py-3">
                  {r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">{r.timelineRuns}</td>
                <td className="px-4 py-3">
                  {r.lastTimelineAt ? new Date(r.lastTimelineAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {r.status === "pending" && (
                      <button
                        className="rounded-xl bg-slate-100 px-3 py-2"
                        onClick={() => approve(r.email)}
                      >
                        Approve
                      </button>
                    )}
                    {r.status === "approved" && (
                      <button
                        className="rounded-xl bg-slate-100 px-3 py-2"
                        onClick={() => reapprove(r.email)}
                      >
                        Re-approve
                      </button>
                    )}
                    {r.status === "enrolled" && (
                      <button
                        className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700 border border-rose-200"
                        onClick={() => disable(r.email)}
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function K({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{v}</div>
    </div>
  );
}
