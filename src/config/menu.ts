/**
 * Application Menu Configuration
 * Maps routes to menu items with role-based access
 */

import type { MenuProps } from 'antd';

export type UserRole = 'USER' | 'ADMIN';

interface RouteConfig {
  key: string;
  label: string;
  path: string;
  roles: UserRole[];
  children?: RouteConfig[];
}

/**
 * Application routes configuration
 */
export const routes: RouteConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'estimator',
    label: 'Estimator',
    path: '/estimator',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'project',
    label: 'Projects',
    path: '/project',
    roles: ['USER', 'ADMIN'],
    children: [
      {
        key: 'project-capture',
        label: 'Capture',
        path: '/project/capture',
        roles: ['USER', 'ADMIN'],
      },
      {
        key: 'project-decide',
        label: 'Decide',
        path: '/project/decide',
        roles: ['USER', 'ADMIN'],
      },
      {
        key: 'project-plan',
        label: 'Plan',
        path: '/project/plan',
        roles: ['USER', 'ADMIN'],
      },
      {
        key: 'project-present',
        label: 'Present',
        path: '/project/present',
        roles: ['USER', 'ADMIN'],
      },
    ],
  },
  {
    key: 'timeline',
    label: 'Timeline',
    path: '/timeline',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'gantt',
    label: 'Gantt Tool',
    path: '/gantt-tool',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'org-chart',
    label: 'Organization',
    path: '/organization-chart',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'resources',
    label: 'Resources',
    path: '/resource-planning',
    roles: ['USER', 'ADMIN'],
  },
  {
    key: 'admin',
    label: 'Admin',
    path: '/admin',
    roles: ['ADMIN'],
    children: [
      {
        key: 'admin-users',
        label: 'Users',
        path: '/admin/users',
        roles: ['ADMIN'],
      },
      {
        key: 'admin-approvals',
        label: 'Approvals',
        path: '/admin/approvals',
        roles: ['ADMIN'],
      },
    ],
  },
];

/**
 * Convert routes to Ant Design menu items
 * Filters by user role
 */
export function getMenuItems(userRole: UserRole): MenuProps['items'] {
  const filterByRole = (items: RouteConfig[]): MenuProps['items'] => {
    return items
      .filter(item => item.roles.includes(userRole))
      .map(item => {
        const menuItem: any = {
          key: item.key,
          label: item.label,
        };

        if (item.children) {
          menuItem.children = filterByRole(item.children);
        }

        return menuItem;
      });
  };

  return filterByRole(routes);
}

/**
 * Get breadcrumb items for a path
 */
export function getBreadcrumbItems(pathname: string): { title: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: { title: string; href?: string }[] = [
    { title: 'Home', href: '/' },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Find route config
    const findRoute = (routes: RouteConfig[], path: string): RouteConfig | null => {
      for (const route of routes) {
        if (route.path === path) return route;
        if (route.children) {
          const found = findRoute(route.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const route = findRoute(routes, currentPath);
    if (route) {
      items.push({
        title: route.label,
        href: segments[segments.length - 1] === segment ? undefined : route.path,
      });
    } else {
      // Fallback: capitalize segment
      items.push({
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
      });
    }
  }

  return items;
}
