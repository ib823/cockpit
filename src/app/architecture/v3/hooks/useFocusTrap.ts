/**
 * useFocusTrap Hook
 *
 * Implements WCAG 2.1.2 compliant focus trap for modals and dialogs.
 * Ensures keyboard users cannot escape modal context until explicitly closed.
 *
 * Apple HIG Compliance:
 * - Focus moves to first interactive element on modal open
 * - Tab cycles within modal (first ↔ last)
 * - Shift+Tab cycles backward
 * - Escape key closes modal
 * - Focus returns to trigger element on close
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap(isOpen, onClose);
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'summary',
].join(', ');

interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  enabled: boolean;

  /**
   * Callback when Escape key is pressed
   */
  onEscape?: () => void;

  /**
   * Whether to restore focus to trigger element on unmount
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Whether to auto-focus first element on mount
   * @default true
   */
  autoFocus?: boolean;
}

/**
 * Creates a focus trap within a container element
 *
 * @param options - Configuration options
 * @returns Ref to attach to container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions
): React.RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { enabled, onEscape, restoreFocus = true, autoFocus = true } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Save currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    if (autoFocus) {
      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    /**
     * Handle Tab key to trap focus within modal
     */
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !container) return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift+Tab on first element -> focus last
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab on last element -> focus first
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    };

    /**
     * Handle Escape key to close modal
     */
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };

    // Attach event listeners
    document.addEventListener('keydown', handleTab);
    if (onEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleTab);
      if (onEscape) {
        document.removeEventListener('keydown', handleEscape);
      }

      // Restore focus to previous element
      if (restoreFocus && previousFocusRef.current) {
        // Small delay to ensure modal is removed from DOM
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [enabled, onEscape, restoreFocus, autoFocus]);

  return containerRef;
}

/**
 * Simpler hook variant for common use case
 */
export function useModalFocusTrap(
  isOpen: boolean,
  onClose: () => void
): React.RefObject<HTMLDivElement> {
  return useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
    autoFocus: true,
  });
}
