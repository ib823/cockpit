/**
 * Accessibility Utilities
 *
 * Helper functions for WCAG 2.1 AA compliant accessibility.
 * Follows Apple Human Interface Guidelines for inclusive design.
 */

/**
 * Generate unique ARIA IDs for labeling relationships
 *
 * @example
 * ```tsx
 * const labelId = generateAriaId('entity-name');
 * const inputId = generateAriaId('entity-name-input');
 *
 * <label id={labelId} htmlFor={inputId}>Entity Name</label>
 * <input id={inputId} aria-labelledby={labelId} />
 * ```
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate consistent IDs for ARIA relationships
 */
export function generateIds(baseId: string) {
  return {
    trigger: `${baseId}-trigger`,
    content: `${baseId}-content`,
    label: `${baseId}-label`,
    description: `${baseId}-description`,
  };
}

/**
 * Announce message to screen readers via aria-live region
 *
 * Creates a temporary aria-live region to announce messages.
 * The region is automatically removed after announcement.
 *
 * @param message - Message to announce
 * @param priority - 'polite' (wait for pause) or 'assertive' (interrupt)
 *
 * @example
 * ```tsx
 * announceToScreenReader('Project saved successfully', 'polite');
 * announceToScreenReader('Error: Failed to save', 'assertive');
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // Remove after announcement (screen readers need ~1s to read)
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1500);
}

/**
 * Get all focusable elements within a container
 *
 * @param container - Container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not(:disabled)',
    '[href]',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    'summary',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Move focus to first focusable element in container
 *
 * @param container - Container element
 * @returns Whether focus was moved successfully
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  return false;
}

/**
 * Move focus to last focusable element in container
 *
 * @param container - Container element
 * @returns Whether focus was moved successfully
 */
export function focusLastElement(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus();
    return true;
  }
  return false;
}

/**
 * Check if element is visible and focusable
 *
 * @param element - Element to check
 * @returns Whether element can receive focus
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1') return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity) === 0) return false;

  return true;
}

/**
 * Trap focus within container (for modals/dialogs)
 * Returns cleanup function
 *
 * @param container - Container element
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Save previously focused element
  const previouslyFocused = document.activeElement as HTMLElement;

  // Focus first element
  firstElement.focus();

  const handleTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    // Shift+Tab on first -> focus last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab on last -> focus first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  };

  document.addEventListener('keydown', handleTab);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleTab);
    previouslyFocused?.focus();
  };
}

/**
 * Check if touch is primary input method
 * Used to determine appropriate touch target sizes
 *
 * @returns Whether device uses touch as primary input
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
}

/**
 * Get minimum touch target size based on device
 * Apple HIG: 44x44pt minimum
 * Android: 48x48dp minimum
 *
 * @returns Minimum size in pixels
 */
export function getMinimumTouchTargetSize(): number {
  return isTouchDevice() ? 44 : 40; // 44px for touch, 40px for pointer
}

/**
 * Visually hide element but keep accessible to screen readers
 * Returns className for sr-only utility
 */
export function getSrOnlyClassName(): string {
  return 'sr-only';
}

/**
 * Create SR-only label element
 *
 * @param text - Label text
 * @param id - Optional ID for aria-labelledby
 * @returns Label element
 */
export function createSrOnlyLabel(text: string, id?: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.className = 'sr-only';
  if (id) label.id = id;
  return label;
}

/**
 * Keyboard event helpers
 */
export const isEnterKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Enter';

export const isSpaceKey = (event: React.KeyboardEvent): boolean =>
  event.key === ' ' || event.key === 'Spacebar';

export const isEscapeKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Escape' || event.key === 'Esc';

export const isActivationKey = (event: React.KeyboardEvent): boolean =>
  isEnterKey(event) || isSpaceKey(event);

export const isArrowKey = (event: React.KeyboardEvent): boolean =>
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

/**
 * Handle button keyboard activation (Enter/Space)
 * Prevents default and calls callback
 *
 * @example
 * ```tsx
 * <div
 *   role="button"
 *   tabIndex={0}
 *   onKeyDown={handleButtonKeyDown(() => handleClick())}
 * >
 * ```
 */
export function handleButtonKeyDown(
  callback: () => void
): (event: React.KeyboardEvent) => void {
  return (event: React.KeyboardEvent) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  };
}

/**
 * Format time ago for screen readers
 *
 * @param date - Date to format
 * @returns Human-readable time ago string
 */
export function formatTimeAgoForScreenReader(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
