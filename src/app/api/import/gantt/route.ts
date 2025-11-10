import { NextResponse } from "next/server";
import type { GanttTask } from "@/types/gantt";
export async function POST(req: Request) {
  const tasks = (await req.json()) as GanttTask[];
  if (!Array.isArray(tasks))
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  return NextResponse.json({ ok: true, count: tasks.length });
}
