import type { NavItem } from "@/components/ds/AppShell";

/**
 * The admin destinations.
 *
 * Defined once rather than repeated in each page's markup: before this, every
 * admin route hand-rolled the same nav bar, so adding a destination meant
 * editing six files and the "current" highlight was set by hand each time.
 */
export function adminNav(current: string): NavItem[] {
  return [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Email approvals", href: "/admin/email-approvals" },
    { label: "Recovery", href: "/admin/recovery-requests" },
    { label: "Security", href: "/admin/security" },
  ].map((item) => ({ ...item, current: item.href === current }));
}
