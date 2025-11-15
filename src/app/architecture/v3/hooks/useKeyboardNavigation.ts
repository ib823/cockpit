/**
 * useKeyboardNavigation Hook
 *
 * Provides keyboard navigation for tab interfaces, lists, and other navigable components.
 * Implements Apple HIG keyboard navigation patterns.
 *
 * Supported Patterns:
 * - Tab navigation (Left/Right arrow keys)
 * - List navigation (Up/Down arrow keys)
 * - Grid navigation (Arrow keys in 2D)
 * - Enter/Space for activation
 * - Home/End for first/last item
 *
 * @example
 * ```tsx
 * function TabBar({ tabs, activeTab, onTabChange }) {
 *   const { handleKeyDown } = useKeyboardNavigation({
 *     type: 'horizontal',
 *     items: tabs,
 *     activeIndex: tabs.findIndex(t => t.id === activeTab),
 *     onSelect: (index) => onTabChange(tabs[index].id),
 *   });
 *
 *   return (
 *     <div role="tablist">
 *       {tabs.map((tab, index) => (
 *         <button
 *           key={tab.id}
 *           role="tab"
 *           aria-selected={activeTab === tab.id}
 *           tabIndex={activeTab === tab.id ? 0 : -1}
 *           onKeyDown={handleKeyDown}
 *         >
 *           {tab.label}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useRef } from "react";

export type NavigationType = 'horizontal' | 'vertical' | 'grid' | 'both';

export interface UseKeyboardNavigationOptions<T = any> {
  /**
   * Type of navigation (horizontal for tabs, vertical for lists)
   */
  type: NavigationType;

  /**
   * Array of items being navigated
   */
  items: T[];

  /**
   * Currently active index
   */
  activeIndex: number;

  /**
   * Callback when an item is selected
   */
  onSelect: (index: number) => void;

  /**
   * Callback when Enter/Space is pressed on active item
   */
  onActivate?: (index: number) => void;

  /**
   * Number of columns (for grid navigation)
   */
  columns?: number;

  /**
   * Whether navigation should loop (first ↔ last)
   * @default true
   */
  loop?: boolean;

  /**
   * Whether to prevent default behavior
   * @default true
   */
  preventDefault?: boolean;
}

export function useKeyboardNavigation<T = any>({
  type,
  items,
  activeIndex,
  onSelect,
  onActivate,
  columns = 1,
  loop = true,
  preventDefault = true,
}: UseKeyboardNavigationOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate next index based on direction
   */
  const getNextIndex = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end'): number => {
      const count = items.length;
      let nextIndex = activeIndex;

      switch (direction) {
        case 'home':
          nextIndex = 0;
          break;

        case 'end':
          nextIndex = count - 1;
          break;

        case 'left':
          if (type === 'horizontal' || type === 'both') {
            nextIndex = activeIndex - 1;
          } else if (type === 'grid') {
            nextIndex = activeIndex - 1;
          }
          break;

        case 'right':
          if (type === 'horizontal' || type === 'both') {
            nextIndex = activeIndex + 1;
          } else if (type === 'grid') {
            nextIndex = activeIndex + 1;
          }
          break;

        case 'up':
          if (type === 'vertical' || type === 'both') {
            nextIndex = activeIndex - 1;
          } else if (type === 'grid') {
            nextIndex = activeIndex - columns;
          }
          break;

        case 'down':
          if (type === 'vertical' || type === 'both') {
            nextIndex = activeIndex + 1;
          } else if (type === 'grid') {
            nextIndex = activeIndex + columns;
          }
          break;
      }

      // Handle looping
      if (loop) {
        if (nextIndex < 0) nextIndex = count - 1;
        if (nextIndex >= count) nextIndex = 0;
      } else {
        // Clamp to valid range
        nextIndex = Math.max(0, Math.min(count - 1, nextIndex));
      }

      return nextIndex;
    },
    [activeIndex, items.length, type, columns, loop]
  );

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let handled = false;
      let nextIndex = activeIndex;

      switch (event.key) {
        case 'ArrowLeft':
          nextIndex = getNextIndex('left');
          handled = true;
          break;

        case 'ArrowRight':
          nextIndex = getNextIndex('right');
          handled = true;
          break;

        case 'ArrowUp':
          nextIndex = getNextIndex('up');
          handled = true;
          break;

        case 'ArrowDown':
          nextIndex = getNextIndex('down');
          handled = true;
          break;

        case 'Home':
          nextIndex = getNextIndex('home');
          handled = true;
          break;

        case 'End':
          nextIndex = getNextIndex('end');
          handled = true;
          break;

        case 'Enter':
        case ' ':
          if (onActivate) {
            onActivate(activeIndex);
            handled = true;
          }
          break;
      }

      if (handled) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Only update if index changed
        if (nextIndex !== activeIndex) {
          onSelect(nextIndex);

          // Focus the newly selected element
          if (containerRef.current) {
            const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
              '[role="tab"], [role="option"], [role="menuitem"], button, a'
            );
            if (focusableElements[nextIndex]) {
              focusableElements[nextIndex].focus();
            }
          }
        }
      }
    },
    [activeIndex, getNextIndex, onSelect, onActivate, preventDefault]
  );

  return {
    containerRef,
    handleKeyDown,
  };
}

/**
 * Convenience hook for horizontal tab navigation
 */
export function useTabKeyboardNavigation(
  tabs: any[],
  activeTabId: string,
  onTabChange: (tabId: string) => void
) {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  return useKeyboardNavigation({
    type: 'horizontal',
    items: tabs,
    activeIndex: activeIndex === -1 ? 0 : activeIndex,
    onSelect: (index) => onTabChange(tabs[index].id),
  });
}

/**
 * Convenience hook for vertical list navigation
 */
export function useListKeyboardNavigation<T>(
  items: T[],
  selectedIndex: number,
  onSelect: (index: number) => void,
  onActivate?: (index: number) => void
) {
  return useKeyboardNavigation({
    type: 'vertical',
    items,
    activeIndex: selectedIndex,
    onSelect,
    onActivate,
  });
}
