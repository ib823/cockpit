// src/hooks/useReferenceKeyboard.ts
import { useEffect } from 'react';
import { useWrappersStore } from '@/stores/wrappers-store';

/**
 * Keyboard shortcuts for SAP Activate Reference:
 * - Shift + ? : Toggle reference modal (help)
 * - Cmd/Ctrl + K : Toggle mini reference bar
 * - Escape : Close modal if open
 */
export function useReferenceKeyboard() {
  const { showModal, showReference, toggleModal, toggleReference } = useWrappersStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shift + ? : Toggle modal
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        toggleModal();
        return;
      }

      // Cmd/Ctrl + K : Toggle reference bar
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleReference();
        return;
      }

      // Escape : Close modal if open
      if (event.key === 'Escape' && showModal) {
        event.preventDefault();
        toggleModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReference, toggleModal, toggleReference]);
}
