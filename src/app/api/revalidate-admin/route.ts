import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";

export const GET = withAdmin(async () => {
  try {
    revalidateTag("admin-stats");
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch {
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
});
