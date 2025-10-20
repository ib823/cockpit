import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  footer,
  width = 560,
  children
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    prevFocus.current = (document.activeElement as HTMLElement) ?? null;

    const focusable = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = nodes ? Array.from(nodes).filter((n) => !n.hasAttribute('disabled')) : [];

        if (list.length === 0) {
          e.preventDefault();
          return;
        }

        const first = list[0];
        const last = list[list.length - 1];
        const cur = document.activeElement as HTMLElement;

        if (e.shiftKey && cur === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && cur === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
        style={{ width }}
      >
        <div className="p-6">
          {title && <h3 className="text-lg font-semibold mb-2 text-[var(--ink)]">{title}</h3>}
          <div className="text-[14px] text-[var(--ink)]">{children}</div>
        </div>
        {footer && <div className="px-6 pb-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
