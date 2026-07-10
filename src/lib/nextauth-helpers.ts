import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authConfig } from "./auth";

// NOTE: session *creation* lives in `src/lib/auth/session.ts`
// (`establishSession`) — the single source of truth every login flow uses.
// This module only reads sessions and clears cookies.

export async function requireAdmin() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    throw new Error("unauthorized");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("forbidden");
  }

  return session;
}

export async function getSession() {
  return await getServerSession(authConfig);
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();

  // Clear NextAuth session cookie
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");

  // Clear CSRF token
  cookieStore.delete("next-auth.csrf-token");
  cookieStore.delete("__Host-next-auth.csrf-token");

  // Clear callback URL
  cookieStore.delete("next-auth.callback-url");
  cookieStore.delete("__Secure-next-auth.callback-url");
}
