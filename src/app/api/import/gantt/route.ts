import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import type { GanttTask } from "@/types/gantt";

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tasks = (await req.json()) as GanttTask[];
  if (!Array.isArray(tasks))
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  return NextResponse.json({ ok: true, count: tasks.length });
}
