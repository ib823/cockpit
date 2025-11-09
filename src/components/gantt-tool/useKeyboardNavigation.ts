/**
 * Keyboard Navigation Hook for Gantt Tool
 *
 * Provides comprehensive keyboard support for accessibility and power users.
 * Follows WCAG 2.1 guidelines for keyboard navigation.
 */

import { useEffect, useCallback, useRef } from 'react';
import type { GanttProject, GanttPhase, GanttTask } from '@/types/gantt-tool';

interface KeyboardNavigationOptions {
  currentProject: GanttProject | null;
  selection: { selectedItemId: string | null; selectedItemType: 'phase' | 'task' | 'milestone' | null };
  selectItem: (id: string, type: 'phase' | 'task' | 'milestone') => void;
  togglePhaseCollapse: (phaseId: string) => void;
  openSidePanel: (mode: 'add' | 'edit', itemType: 'phase' | 'task' | 'milestone' | 'holiday', itemId?: string) => void;
  deletePhase?: (phaseId: string) => void;
  deleteTask?: (taskId: string, phaseId: string) => void;
  focusPhase?: (phaseId: string | null) => void;
  exitFocusMode?: () => void;
  focusedPhaseId?: string | null;
}

export function useKeyboardNavigation({
  currentProject,
  selection,
  selectItem,
  togglePhaseCollapse,
  openSidePanel,
  deletePhase,
  deleteTask,
  focusPhase,
  exitFocusMode,
  focusedPhaseId,
}: KeyboardNavigationOptions) {
  const lastActionRef = useRef<string>('');

  /**
   * Get flat list of all navigable items (phases and tasks)
   */
  const getNavigableItems = useCallback(() => {
    if (!currentProject) return [];

    const items: Array<{ id: string; type: 'phase' | 'task'; phaseId?: string }> = [];

    currentProject.phases.forEach((phase) => {
      items.push({ id: phase.id, type: 'phase' });

      // Only include tasks if phase is expanded
      if (!phase.collapsed) {
        phase.tasks.forEach((task) => {
          items.push({ id: task.id, type: 'task', phaseId: phase.id });
        });
      }
    });

    return items;
  }, [currentProject]);

  /**
   * Navigate to next/previous item
   */
  const navigateItems = useCallback((direction: 'next' | 'previous') => {
    const items = getNavigableItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex(
      (item) => item.id === selection.selectedItemId && item.type === selection.selectedItemType
    );

    let nextIndex: number;
    if (currentIndex === -1) {
      // No selection, select first or last
      nextIndex = direction === 'next' ? 0 : items.length - 1;
    } else {
      // Move to next/previous item
      nextIndex = direction === 'next'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
    }

    const nextItem = items[nextIndex];
    selectItem(nextItem.id, nextItem.type);

    // Scroll into view
    setTimeout(() => {
      const element = document.querySelector(`[data-item-id="${nextItem.id}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, [getNavigableItems, selection, selectItem]);

  /**
   * Navigate to parent phase (from task)
   */
  const navigateToParent = useCallback(() => {
    if (!currentProject || selection.selectedItemType !== 'task') return;

    const phase = currentProject.phases.find((p) =>
      p.tasks.some((t) => t.id === selection.selectedItemId)
    );

    if (phase) {
      selectItem(phase.id, 'phase');
    }
  }, [currentProject, selection, selectItem]);

  /**
   * Navigate to first child task (from phase)
   */
  const navigateToFirstChild = useCallback(() => {
    if (!currentProject || selection.selectedItemType !== 'phase') return;

    const phase = currentProject.phases.find((p) => p.id === selection.selectedItemId);
    if (phase && phase.tasks.length > 0 && !phase.collapsed) {
      selectItem(phase.tasks[0].id, 'task');
    }
  }, [currentProject, selection, selectItem]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't interfere with input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? metaKey : ctrlKey;

    // Arrow key navigation
    if (key === 'ArrowDown' && !shiftKey && !altKey && !cmdKey) {
      event.preventDefault();
      navigateItems('next');
      lastActionRef.current = 'navigate-down';
    } else if (key === 'ArrowUp' && !shiftKey && !altKey && !cmdKey) {
      event.preventDefault();
      navigateItems('previous');
      lastActionRef.current = 'navigate-up';
    } else if (key === 'ArrowLeft' && !shiftKey && !altKey && !cmdKey) {
      event.preventDefault();
      if (selection.selectedItemType === 'phase') {
        // Collapse phase
        if (selection.selectedItemId) {
          togglePhaseCollapse(selection.selectedItemId);
        }
      } else {
        // Navigate to parent
        navigateToParent();
      }
      lastActionRef.current = 'navigate-left';
    } else if (key === 'ArrowRight' && !shiftKey && !altKey && !cmdKey) {
      event.preventDefault();
      if (selection.selectedItemType === 'phase') {
        const phase = currentProject?.phases.find((p) => p.id === selection.selectedItemId);
        if (phase?.collapsed) {
          // Expand phase
          togglePhaseCollapse(selection.selectedItemId!);
        } else {
          // Navigate to first child
          navigateToFirstChild();
        }
      }
      lastActionRef.current = 'navigate-right';
    }
    // Enter or Space - Open edit panel
    else if ((key === 'Enter' || key === ' ') && !cmdKey && !altKey) {
      event.preventDefault();
      if (selection.selectedItemId && selection.selectedItemType) {
        openSidePanel('edit', selection.selectedItemType, selection.selectedItemId);
        lastActionRef.current = 'open-edit';
      }
    }
    // Delete - Delete selected item
    else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      if (selection.selectedItemId && selection.selectedItemType) {
        if (selection.selectedItemType === 'phase' && deletePhase) {
          if (confirm('Delete this phase and all its tasks?')) {
            deletePhase(selection.selectedItemId);
            lastActionRef.current = 'delete-phase';
          }
        } else if (selection.selectedItemType === 'task' && deleteTask) {
          const phase = currentProject?.phases.find((p) =>
            p.tasks.some((t) => t.id === selection.selectedItemId)
          );
          if (phase && confirm('Delete this task?')) {
            deleteTask(selection.selectedItemId, phase.id);
            lastActionRef.current = 'delete-task';
          }
        }
      }
    }
    // Escape - Deselect / Exit focus mode
    else if (key === 'Escape') {
      event.preventDefault();
      if (focusedPhaseId && exitFocusMode) {
        exitFocusMode();
        lastActionRef.current = 'exit-focus';
      } else if (selection.selectedItemId) {
        selectItem('', 'phase'); // Deselect
        lastActionRef.current = 'deselect';
      }
    }
    // F - Focus on selected phase (RTS mode)
    else if (key === 'f' && !cmdKey && !altKey && !shiftKey) {
      event.preventDefault();
      if (selection.selectedItemType === 'phase' && selection.selectedItemId && focusPhase) {
        focusPhase(selection.selectedItemId);
        lastActionRef.current = 'focus-phase';
      }
    }
    // N - New phase
    else if (key === 'n' && !cmdKey && !altKey && !shiftKey) {
      event.preventDefault();
      openSidePanel('add', 'phase');
      lastActionRef.current = 'new-phase';
    }
    // T - New task (if phase selected)
    else if (key === 't' && !cmdKey && !altKey && !shiftKey) {
      event.preventDefault();
      if (selection.selectedItemType === 'phase') {
        openSidePanel('add', 'task');
        lastActionRef.current = 'new-task';
      }
    }
    // M - New milestone
    else if (key === 'm' && !cmdKey && !altKey && !shiftKey) {
      event.preventDefault();
      openSidePanel('add', 'milestone');
      lastActionRef.current = 'new-milestone';
    }
    // ? - Show keyboard shortcuts help
    else if (key === '?' && shiftKey) {
      event.preventDefault();
      // TODO: Show keyboard shortcuts modal
      console.log('Keyboard shortcuts help');
      lastActionRef.current = 'show-help';
    }
  }, [
    currentProject,
    selection,
    navigateItems,
    navigateToParent,
    navigateToFirstChild,
    selectItem,
    togglePhaseCollapse,
    openSidePanel,
    deletePhase,
    deleteTask,
    focusPhase,
    exitFocusMode,
    focusedPhaseId,
  ]);

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Get last action for debugging/feedback
   */
  const getLastAction = useCallback(() => lastActionRef.current, []);

  return {
    getLastAction,
  };
}

/**
 * Keyboard Shortcuts Reference
 *
 * Navigation:
 * - Arrow Down: Next item
 * - Arrow Up: Previous item
 * - Arrow Left: Collapse phase / Go to parent task
 * - Arrow Right: Expand phase / Go to first child
 *
 * Actions:
 * - Enter/Space: Edit selected item
 * - Delete/Backspace: Delete selected item
 * - Escape: Deselect / Exit focus mode
 * - F: Focus on selected phase (RTS zoom)
 *
 * Create:
 * - N: New phase
 * - T: New task (when phase selected)
 * - M: New milestone
 *
 * Help:
 * - Shift+?: Show keyboard shortcuts
 */
