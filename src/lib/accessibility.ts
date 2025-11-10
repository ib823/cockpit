/**
 * Accessibility Utilities - WCAG 2.1 AA Compliance
 * Apple Human Interface Guidelines - Section 10: Accessibility
 *
 * Provides ARIA labels, roles, and keyboard navigation helpers
 * to ensure the application is fully accessible to screen readers
 * and keyboard-only users.
 */

/**
 * ARIA Label Helpers
 */

export const ariaLabels = {
  // Navigation
  navigation: {
    main: "Main navigation",
    breadcrumb: "Breadcrumb navigation",
    pagination: "Pagination navigation",
    tabs: "Tab navigation",
  },

  // Gantt Chart
  gantt: {
    chart: "Gantt chart project timeline",
    task: (taskName: string) => `Task: ${taskName}`,
    phase: (phaseName: string) => `Phase: ${phaseName}`,
    milestone: (name: string) => `Milestone: ${name}`,
    dependency: (from: string, to: string) => `Dependency from ${from} to ${to}`,
    timeline: "Timeline header",
    today: "Today's date marker",
  },

  // Modals
  modal: {
    close: "Close modal",
    dialog: (title: string) => `${title} dialog`,
    missionControl: "Mission Control: Project analytics and insights",
    resourceManagement: "Resource Management: Manage team members and allocations",
  },

  // Resources
  resource: {
    list: "Resource list",
    item: (name: string, role: string) => `${name}, ${role}`,
    avatar: (name: string) => `${name}'s avatar`,
    utilization: (name: string, percent: number) =>
      `${name} utilization: ${percent}% of capacity`,
    assignments: (count: number) =>
      `${count} ${count === 1 ? 'assignment' : 'assignments'}`,
    conflict: (name: string) => `Warning: ${name} has scheduling conflicts`,
    actions: (name: string) => `Actions for ${name}`,
    edit: (name: string) => `Edit ${name}`,
    delete: (name: string) => `Delete ${name}`,
  },

  // Tasks
  task: {
    list: "Task list",
    item: (name: string) => `Task: ${name}`,
    status: (status: string) => `Status: ${status}`,
    progress: (percent: number) => `Progress: ${percent}% complete`,
    priority: (priority: string) => `Priority: ${priority}`,
    dueDate: (date: string) => `Due: ${date}`,
    assignees: (count: number) =>
      `Assigned to ${count} ${count === 1 ? 'person' : 'people'}`,
  },

  // Actions
  action: {
    add: (item: string) => `Add ${item}`,
    edit: (item: string) => `Edit ${item}`,
    delete: (item: string) => `Delete ${item}`,
    save: "Save changes",
    cancel: "Cancel",
    expand: "Expand details",
    collapse: "Collapse details",
    more: "More options",
    filter: "Filter options",
    sort: "Sort options",
    search: "Search",
  },

  // Status
  status: {
    loading: "Loading content...",
    saving: "Saving changes...",
    success: (action: string) => `Success: ${action}`,
    error: (message: string) => `Error: ${message}`,
    empty: (item: string) => `No ${item} found`,
  },

  // Forms
  form: {
    required: (field: string) => `${field} (required)`,
    optional: (field: string) => `${field} (optional)`,
    validation: (field: string, error: string) => `${field}: ${error}`,
    characterCount: (current: number, max: number) =>
      `${current} of ${max} characters`,
  },
};

/**
 * ARIA Role Helpers
 */

export const ariaRoles = {
  // Structural
  banner: "banner",
  navigation: "navigation",
  main: "main",
  complementary: "complementary",
  contentinfo: "contentinfo",

  // Widget
  button: "button",
  checkbox: "checkbox",
  dialog: "dialog",
  link: "link",
  menuitem: "menuitem",
  progressbar: "progressbar",
  radio: "radio",
  searchbox: "searchbox",
  slider: "slider",
  spinbutton: "spinbutton",
  switch: "switch",
  tab: "tab",
  tabpanel: "tabpanel",
  textbox: "textbox",
  tooltip: "tooltip",

  // Composite
  grid: "grid",
  listbox: "listbox",
  menu: "menu",
  menubar: "menubar",
  tablist: "tablist",
  tree: "tree",
  treegrid: "treegrid",

  // Document
  article: "article",
  cell: "cell",
  columnheader: "columnheader",
  definition: "definition",
  directory: "directory",
  document: "document",
  feed: "feed",
  figure: "figure",
  group: "group",
  heading: "heading",
  img: "img",
  list: "list",
  listitem: "listitem",
  math: "math",
  note: "note",
  presentation: "presentation",
  region: "region",
  row: "row",
  rowgroup: "rowgroup",
  rowheader: "rowheader",
  separator: "separator",
  table: "table",
  term: "term",
  toolbar: "toolbar",
};

/**
 * Keyboard Navigation Helpers
 */

export const keyboardHandlers = {
  /**
   * Handle escape key to close modals/menus
   */
  onEscape: (callback: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle enter/space to activate buttons
   */
  onActivate: (callback: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle arrow key navigation
   */
  onArrowNavigation: (callbacks: {
    up?: () => void;
    down?: () => void;
    left?: () => void;
    right?: () => void;
  }) => (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        if (callbacks.up) {
          e.preventDefault();
          callbacks.up();
        }
        break;
      case "ArrowDown":
        if (callbacks.down) {
          e.preventDefault();
          callbacks.down();
        }
        break;
      case "ArrowLeft":
        if (callbacks.left) {
          e.preventDefault();
          callbacks.left();
        }
        break;
      case "ArrowRight":
        if (callbacks.right) {
          e.preventDefault();
          callbacks.right();
        }
        break;
    }
  },

  /**
   * Handle tab trapping within modals
   */
  trapFocus: (containerRef: HTMLElement) => (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusableElements = containerRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  },
};

/**
 * ARIA State Helpers
 */

export const ariaStates = {
  expanded: (isExpanded: boolean) => ({ "aria-expanded": isExpanded }),
  selected: (isSelected: boolean) => ({ "aria-selected": isSelected }),
  checked: (isChecked: boolean) => ({ "aria-checked": isChecked }),
  pressed: (isPressed: boolean) => ({ "aria-pressed": isPressed }),
  disabled: (isDisabled: boolean) => ({ "aria-disabled": isDisabled }),
  hidden: (isHidden: boolean) => ({ "aria-hidden": isHidden }),
  current: (type: "page" | "step" | "location" | "date" | "time" | "true") =>
    ({ "aria-current": type }),
  live: (politeness: "polite" | "assertive" | "off") =>
    ({ "aria-live": politeness }),
  busy: (isBusy: boolean) => ({ "aria-busy": isBusy }),
};

/**
 * Screen Reader Only Text
 * Helper to get screen reader only class
 * Usage: <span className="sr-only">{text}</span>
 */
export const srOnlyClass = "sr-only";

/**
 * Announce to Screen Readers
 * Dynamically announce changes to screen reader users
 */
export const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus Management
 */
export const focusManagement = {
  /**
   * Move focus to element
   */
  moveTo: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },

  /**
   * Save and restore focus (useful for modals)
   */
  saveRestore: () => {
    const previousElement = document.activeElement as HTMLElement;
    return () => {
      if (previousElement) {
        previousElement.focus();
      }
    };
  },

  /**
   * Focus first error in form
   */
  focusFirstError: (containerRef: HTMLElement) => {
    const firstError = containerRef.querySelector('[aria-invalid="true"]') as HTMLElement;
    if (firstError) {
      firstError.focus();
    }
  },
};

/**
 * Contrast Ratio Utilities
 * Helpers to ensure WCAG 2.1 AA compliance (4.5:1 for body text, 3:1 for large text)
 */
export const contrastHelpers = {
  /**
   * Calculate relative luminance
   */
  getLuminance: (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = contrastHelpers.getLuminance(color1);
    const lum2 = contrastHelpers.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast meets WCAG AA standard
   */
  meetsWCAG_AA: (
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): boolean => {
    const ratio = contrastHelpers.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },
};
