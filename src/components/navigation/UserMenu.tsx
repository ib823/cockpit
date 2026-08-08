"use client";

/**
 * The top bar's account cluster: role, identity, exit.
 *
 * The admin pill is always visible rather than tucked in a menu because the
 * role changes what every control on the screen does (principle P3). The
 * email doubles as the link to the account page, so identity and "manage my
 * identity" are the same target.
 *
 * Logout is confirmed in a ds Modal and then repeats the hardened sequence
 * from the original LogoutButton: server-side session end, local/session
 * storage cleared, and a `replace` + hard reload so the back button cannot
 * resurrect an authenticated screen from history or memory.
 */

import Link from "next/link";
import React, { useState } from "react";
import type { Session } from "next-auth";
import { logger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/Button";
import { Modal } from "@/components/ds/Modal";
import { StatusPill } from "@/components/ds/Display";
import styles from "./UserMenu.module.css";

export function UserMenu({ session }: { session: Session | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!session?.user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      // SECURITY: Clear all local storage and session storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // SECURITY: replace (not push) so back cannot return here, then a hard
      // navigation to clear any in-memory state.
      router.replace("/login?logged_out=" + Date.now());
      window.location.href = "/login";
    } catch (error) {
      logger.error("Logout error", { error });
      setLoggingOut(false);
    }
  };

  return (
    <>
      {session.user.role === "ADMIN" && <StatusPill tone="info">Admin</StatusPill>}
      <Link href="/account" className={styles.email}>
        {session.user.email}
      </Link>
      <Button variant="tertiary" size="sm" onClick={() => setConfirming(true)}>
        Log out
      </Button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Log out?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loggingOut}
              loadingLabel="Logging out…"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </>
        }
      >
        <p>Unsaved local changes stay on this device; you can sign back in with your passkey.</p>
      </Modal>
    </>
  );
}
