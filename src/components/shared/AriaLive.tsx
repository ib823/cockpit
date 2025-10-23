/**
 * AriaLive Component
 * Provides screen reader announcements for dynamic content updates
 *
 * Usage:
 * <AriaLive message="Calculation complete" priority="polite" />
 */

'use client';

import { useEffect, useRef } from 'react';

interface AriaLiveProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after N milliseconds
}

export function AriaLive({
  message,
  priority = 'polite',
  clearAfter = 3000
}: AriaLiveProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message || !messageRef.current) return;

    // Clear previous content
    messageRef.current.textContent = '';

    // Set new content after a tiny delay to ensure screen reader picks it up
    const setTimer = setTimeout(() => {
      if (messageRef.current) {
        messageRef.current.textContent = message;
      }
    }, 100);

    // Clear after specified time
    const clearTimer = setTimeout(() => {
      if (messageRef.current) {
        messageRef.current.textContent = '';
      }
    }, clearAfter);

    return () => {
      clearTimeout(setTimer);
      clearTimeout(clearTimer);
    };
  }, [message, clearAfter]);

  return (
    <div
      ref={messageRef}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    />
  );
}

/**
 * Hook for programmatic announcements
 *
 * Usage:
 * const announce = useAriaAnnounce();
 * announce('Form saved successfully');
 */
export function useAriaAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement div if it doesn't exist
    if (!announceRef.current) {
      const div = document.createElement('div');
      div.setAttribute('role', 'status');
      div.setAttribute('aria-live', 'polite');
      div.setAttribute('aria-atomic', 'true');
      div.className = 'sr-only';
      div.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(div);
      announceRef.current = div;
    }

    return () => {
      if (announceRef.current && document.body.contains(announceRef.current)) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  const announce = (message: string) => {
    if (!announceRef.current) return;

    // Clear previous message
    announceRef.current.textContent = '';

    // Set new message after a brief delay
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);

    // Clear after 3 seconds
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 3100);
  };

  return announce;
}
