/**
 * Resource Category Icon Mapping
 *
 * Maps resource categories to Lucide icons instead of emoji.
 * This ensures consistent rendering across platforms and improves accessibility.
 *
 * Apple HIG Compliance:
 * - Uses SF Symbols-style icons (Lucide React)
 * - Consistent 16x16 or 20x20 sizing
 * - Semantic meaning over decoration
 */

import {
  Target,
  BarChart3,
  Code,
  Briefcase,
  Repeat,
  CheckSquare,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ResourceCategory } from '@/types/gantt-tool';

/**
 * Icon component mapping for each resource category
 */
export const RESOURCE_CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  leadership: Target,
  pm: BarChart3,
  technical: Code,
  functional: Briefcase,
  change: Repeat,
  qa: CheckSquare,
  basis: Settings,
  security: Shield,
  client: Users,
  other: Users,
} as const;

/**
 * Get icon component for a resource category
 * @param category - The resource category
 * @returns Lucide icon component
 *
 * @example
 * ```tsx
 * const IconComponent = getResourceIcon('leadership');
 * return <IconComponent className="w-4 h-4 text-blue-600" aria-hidden="true" />;
 * ```
 */
export function getResourceIcon(category: ResourceCategory): LucideIcon {
  return RESOURCE_CATEGORY_ICONS[category] || RESOURCE_CATEGORY_ICONS.other;
}

/**
 * Render resource icon with consistent styling
 * @param category - The resource category
 * @param className - Optional Tailwind classes (default: "w-4 h-4")
 * @param color - Optional color override
 */
export function ResourceIcon({
  category,
  className = 'w-4 h-4',
  color,
}: {
  category: ResourceCategory;
  className?: string;
  color?: string;
}) {
  const IconComponent = getResourceIcon(category);

  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
      aria-hidden="true"
    />
  );
}
