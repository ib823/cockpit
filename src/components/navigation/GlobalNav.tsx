/**
 * Global Navigation Component (Tier 1)
 * Persistent navigation across all tools: Dashboard, Timeline, Architecture
 * Apple HIG compliant - consistent with macOS toolbar patterns
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { Crown, User, LogOut, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import styles from './GlobalNav.module.css';

interface GlobalNavProps {
  session: Session | null;
}

type NavTab = 'dashboard' | 'timeline' | 'architecture';

export function GlobalNav({ session }: GlobalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Determine active tab based on current path
  const getActiveTab = (): NavTab | null => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname?.startsWith('/gantt-tool')) return 'timeline';
    if (pathname?.startsWith('/architecture')) return 'architecture';
    return null;
  };

  const activeTab = getActiveTab();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  if (!session) {
    return null;
  }

  return (
    <nav className={styles.globalNav}>
      {/* Left Zone - Brand */}
      <Link href="/dashboard" className={styles.brand}>
        <div className={styles.logoWrapper}>
          <Image
            src="/logo-keystone.svg"
            alt="Keystone"
            width={32}
            height={32}
            priority
          />
        </div>
        <div className={styles.brandLogo}>Keystone</div>
      </Link>

      {/* Center Zone - Global Tabs */}
      <div className={styles.tabsContainer}>
        <Link
          href="/dashboard"
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`}
        >
          Dashboard
        </Link>

        <Link
          href="/gantt-tool/v3"
          className={`${styles.tab} ${activeTab === 'timeline' ? styles.active : ''}`}
        >
          Timeline
        </Link>

        <Link
          href="/architecture/v3"
          className={`${styles.tab} ${activeTab === 'architecture' ? styles.active : ''}`}
        >
          Architecture
        </Link>
      </div>

      {/* Right Zone - User Actions */}
      <div className={styles.userActions}>
        {isAdmin && (
          <div className={styles.adminBadge}>
            <Crown />
            Admin
          </div>
        )}

        <div className={styles.userInfo}>
          <span className={styles.userEmail}>{session.user.email}</span>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className={styles.userButton}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
          >
            <User />
          </button>

          {/* User Menu Dropdown */}
          <div className={`${styles.userMenu} ${userMenuOpen ? styles.open : ''}`}>
            <button className={styles.menuItem} onClick={() => router.push('/settings')}>
              <Settings />
              Settings
            </button>

            <div className={styles.menuDivider} />

            <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
              <LogOut />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
