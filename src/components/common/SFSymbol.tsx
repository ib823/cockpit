/**
 * SF Symbol Icon Component
 * Replacement for emoji icons per UI_suggestion.md requirements
 *
 * Usage:
 * <SFSymbol name="person.2.fill" size={16} opacity={0.4} />
 */

import React from 'react';
import {
  Users,
  User,
  UserPlus,
  Calendar,
  Clock,
  Layers,
  Package,
  BarChart3,
  LineChart,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit,
  Edit2,
  Copy,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  FileDown,
  FileSpreadsheet,
  Settings,
  Search,
  Filter,
  LayoutDashboard,
  Target,
  Repeat,
  Shield,
  Lock,
  Server,
  Star,
  Hammer,
  Wrench,
  CheckSquare,
  Circle,
} from 'lucide-react';

// Map SF Symbol names to Lucide icons
const SF_SYMBOL_MAP = {
  // People
  'person.2.fill': Users,
  'person.fill': User,
  'person.badge.plus': UserPlus,

  // Time
  'calendar': Calendar,
  'clock': Clock,

  // Layout
  'layers': Layers,
  'square.grid.2x2': LayoutDashboard,
  'rectangle.split.3x1': Layers,

  // Data
  'chart.bar.fill': BarChart3,
  'chart.line.uptrend.xyaxis': LineChart,
  'arrow.up.right': TrendingUp,
  'arrow.down.right': TrendingDown,

  // Status
  'checkmark.circle.fill': CheckCircle,
  'exclamationmark.circle.fill': AlertCircle,
  'exclamationmark.triangle.fill': AlertTriangle,
  'info.circle.fill': Info,
  'circle.fill': Circle,

  // Actions
  'plus': Plus,
  'trash': Trash2,
  'pencil': Edit,
  'doc.on.doc': Copy,
  'arrow.down.circle': Download,
  'arrow.up.circle': Upload,

  // Navigation
  'chevron.down': ChevronDown,
  'chevron.up': ChevronUp,
  'chevron.left': ChevronLeft,
  'chevron.right': ChevronRight,
  'xmark': X,

  // Files
  'doc.text': FileText,
  'doc.fill': FileText,
  'arrow.down.doc': FileDown,
  'tablecells': FileSpreadsheet,

  // Settings
  'gear': Settings,
  'magnifyingglass': Search,
  'line.3.horizontal.decrease.circle': Filter,

  // Project Management
  'target': Target,
  'arrow.triangle.2.circlepath': Repeat,
  'checkmark.shield.fill': CheckSquare,

  // Technical
  'slider.horizontal.3': Wrench,
  'hammer.fill': Hammer,
  'lock.shield.fill': Shield,
  'lock.fill': Lock,
  'server.rack': Server,

  // Leadership
  'star.fill': Star,
} as const;

type SFSymbolName = keyof typeof SF_SYMBOL_MAP;

interface SFSymbolProps {
  name: SFSymbolName;
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
}

/**
 * SF Symbol Component
 * Renders Lucide icons using SF Symbol naming convention
 */
export const SFSymbol: React.FC<SFSymbolProps> = ({
  name,
  size = 16,
  opacity = 1,
  color = 'currentColor',
  className = '',
}) => {
  const IconComponent = SF_SYMBOL_MAP[name];

  if (!IconComponent) {
    console.warn(`SF Symbol "${name}" not found in map`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      style={{ opacity, color }}
      className={className}
      strokeWidth={2}
    />
  );
};

/**
 * Convenience exports for common sizes
 */
export const SFSymbolSM: React.FC<Omit<SFSymbolProps, 'size'>> = (props) => (
  <SFSymbol {...props} size={14} />
);

export const SFSymbolMD: React.FC<Omit<SFSymbolProps, 'size'>> = (props) => (
  <SFSymbol {...props} size={16} />
);

export const SFSymbolLG: React.FC<Omit<SFSymbolProps, 'size'>> = (props) => (
  <SFSymbol {...props} size={20} />
);

export const SFSymbolXL: React.FC<Omit<SFSymbolProps, 'size'>> = (props) => (
  <SFSymbol {...props} size={24} />
);

/**
 * Utility function to get icon for category
 * Replaces emoji icons in resource categories
 */
export const getCategoryIcon = (category: string): SFSymbolName => {
  const categoryMap: Record<string, SFSymbolName> = {
    'Leadership': 'star.fill',
    'Project Management': 'person.2.fill',
    'Change Management': 'arrow.triangle.2.circlepath',
    'Functional': 'slider.horizontal.3',
    'Technical': 'hammer.fill',
    'Basis/Infrastructure': 'server.rack',
    'Security & Authorization': 'lock.shield.fill',
    'Quality Assurance': 'checkmark.shield.fill',
    'Other/General': 'person.fill',
  };

  return categoryMap[category] || 'circle.fill';
};

export default SFSymbol;
