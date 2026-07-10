import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import type { GanttTask } from "@/types/gantt";

export const POST = withAuth(async (req) => {
  const tasks = (await req.json()) as GanttTask[];
  if (!Array.isArray(tasks))
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  return NextResponse.json({ ok: true, count: tasks.length });
});
