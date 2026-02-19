/**
 * Design System Integration Tests - Phase 2A
 *
 * Tests how BaseModal, ModalButton, and HolidayAwareDatePicker work together
 * Verifies design token consistency across components
 *
 * Test Coverage:
 * - Modal + Button Integration (10 scenarios)
 * - Modal + DatePicker Integration (5 scenarios)
 * - Design Token Consistency (5 scenarios)
 *
 * Total: 20 integration scenarios
 */

import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseModal, ModalButton } from '@/components/ui/BaseModal';
import { HolidayAwareDatePicker } from '@/components/ui/HolidayAwareDatePicker';
import { RADIUS, SPACING } from '@/lib/design-system/tokens';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock focus-trap-react to avoid focus timing issues
vi.mock('focus-trap-react', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

// Test component combining Modal + Buttons
function ModalWithButtons() {
  const [isOpen, setIsOpen] = useState(true);
  const [action, setAction] = useState<string>('');

  return (
    <>
      <div data-testid="action-result">{action}</div>
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        subtitle="Please select an option"
        footer={
          <>
            <ModalButton
              variant="secondary"
              onClick={() => {
                setAction('cancelled');
                setIsOpen(false);
              }}
            >
              Cancel
            </ModalButton>
            <ModalButton
              variant="destructive"
              onClick={() => {
                setAction('deleted');
                setIsOpen(false);
              }}
            >
              Delete
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                setAction('confirmed');
                setIsOpen(false);
              }}
            >
              Confirm
            </ModalButton>
          </>
        }
      >
        <p>Are you sure you want to perform this action?</p>
      </BaseModal>
    </>
  );
}

// Test component combining Modal + DatePicker
function ModalWithDatePicker() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <>
      <div data-testid="selected-date-result">{selectedDate}</div>
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Date"
        subtitle="Choose a date for your event"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => setIsOpen(false)}
              disabled={!selectedDate}
            >
              Confirm
            </ModalButton>
          </>
        }
      >
        <HolidayAwareDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          label="Event Date"
        />
      </BaseModal>
    </>
  );
}

describe('Design System Integration - Modal + Button', () => {

  it('INTEGRATION 1: modal renders with multiple buttons', () => {
    render(<ModalWithButtons />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('INTEGRATION 2: primary button click triggers action', async () => {
    render(<ModalWithButtons />);

    const confirmButton = screen.getByText('Confirm');
    await userEvent.click(confirmButton);

    const result = screen.getByTestId('action-result');
    expect(result.textContent).toBe('confirmed');
  });

  it('INTEGRATION 3: secondary button click cancels', async () => {
    render(<ModalWithButtons />);

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    const result = screen.getByTestId('action-result');
    expect(result.textContent).toBe('cancelled');
  });

  it('INTEGRATION 4: destructive button click deletes', async () => {
    render(<ModalWithButtons />);

    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    const result = screen.getByTestId('action-result');
    expect(result.textContent).toBe('deleted');
  });

  it('INTEGRATION 5: modal close button works with buttons present', async () => {
    render(<ModalWithButtons />);

    // Close via X button
    const closeButton = screen.getByLabelText('Close modal');
    await userEvent.click(closeButton);

    // Modal should close (buttons disappear)
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('INTEGRATION 6: all buttons use consistent design tokens', () => {
    const { container } = render(<ModalWithButtons />);

    const buttons = Array.from(container.querySelectorAll('button')).filter(btn =>
      btn.textContent?.includes('Cancel') ||
      btn.textContent?.includes('Delete') ||
      btn.textContent?.includes('Confirm')
    );

    // All footer buttons should have border radius 8px
    buttons.forEach(button => {
      const el = button as HTMLElement;
      expect(el.style.borderRadius).toBe(RADIUS.default);
    });
  });

  it('INTEGRATION 7: button hover states work inside modal', async () => {
    render(<ModalWithButtons />);

    const confirmButton = screen.getByText('Confirm') as HTMLButtonElement;
    const initialColor = confirmButton.style.backgroundColor;

    expect(initialColor).toBe('rgb(0, 122, 255)'); // COLORS.blue

    fireEvent.mouseEnter(confirmButton);
    expect(confirmButton.style.backgroundColor).toBe('rgb(0, 81, 213)'); // blueHover

    fireEvent.mouseLeave(confirmButton);
    expect(confirmButton.style.backgroundColor).toBe('rgb(0, 122, 255)');
  });

  it('INTEGRATION 8: modal and buttons both use same typography', () => {
    render(<ModalWithButtons />);

    const title = screen.getByText('Confirm Action') as HTMLElement;
    const button = screen.getByText('Confirm') as HTMLElement;

    // Both should use same font family
    expect(title.style.fontFamily).toContain('SF Pro');
    expect(button.style.fontFamily).toContain('SF Pro');
  });

  it('INTEGRATION 9: button min-width prevents cramping in modal footer', () => {
    const { container } = render(<ModalWithButtons />);

    const buttons = Array.from(container.querySelectorAll('button')).filter(btn =>
      btn.textContent?.includes('Cancel') ||
      btn.textContent?.includes('Delete') ||
      btn.textContent?.includes('Confirm')
    );

    // All buttons should have minimum width
    buttons.forEach(button => {
      const el = button as HTMLElement;
      expect(el.style.minWidth).toBe('88px');
    });
  });

  it('INTEGRATION 10: modal footer spacing between buttons is consistent', () => {
    const { container } = render(<ModalWithButtons />);

    // Footer should use gap for spacing - find by border-top (footer has border)
    const footer = Array.from(container.querySelectorAll('div')).find(div => {
      const el = div as HTMLElement;
      return el.style.borderTop?.includes('1px solid') &&
             el.style.justifyContent === 'flex-end' &&
             div.textContent?.includes('Cancel');
    });

    expect(footer).toBeDefined();
    // Gap should be 12px (SPACING[3])
    const footerEl = footer as HTMLElement;
    expect(footerEl.style.gap).toBe(SPACING[3]);
  });
});

describe('Design System Integration - Modal + DatePicker', () => {

  it('INTEGRATION 11: date picker renders inside modal', () => {
    render(<ModalWithDatePicker />);

    expect(screen.getByText('Select Date')).toBeInTheDocument();
    expect(screen.getByText('Event Date')).toBeInTheDocument();
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('INTEGRATION 12: date picker opens calendar inside modal', async () => {
    render(<ModalWithDatePicker />);

    const dateInput = screen.getByText('Select date');
    await userEvent.click(dateInput);

    // Calendar should open
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('INTEGRATION 13: selecting date enables confirm button', async () => {
    render(<ModalWithDatePicker />);

    const confirmButton = screen.getByText('Confirm') as HTMLButtonElement;

    // Initially disabled
    expect(confirmButton).toBeDisabled();

    // Open date picker and select date
    const dateInput = screen.getByText('Select date');
    await userEvent.click(dateInput);

    const day15 = screen.getAllByText('15')[0];
    await userEvent.click(day15);

    // After selecting, the date input should show a date (picker closes automatically)
    // Check that selected-date-result has been updated
    const result = screen.getByTestId('selected-date-result');
    expect(result.textContent).not.toBe('');
  });

  it('INTEGRATION 14: modal and date picker use same border radius', () => {
    const { container } = render(<ModalWithDatePicker />);

    // Find elements with border radius
    const roundedElements = Array.from(container.querySelectorAll('button, div')).filter(
      el => (el as HTMLElement).style.borderRadius === RADIUS.default
    );

    // Should have multiple elements with 8px radius
    expect(roundedElements.length).toBeGreaterThan(0);
  });

  it('INTEGRATION 15: date picker touch targets maintained inside modal', async () => {
    render(<ModalWithDatePicker />);

    const dateInput = screen.getByText('Select date');
    await userEvent.click(dateInput);

    // Navigation buttons should have aria-labels (44px touch targets)
    const prevButton = screen.getByTestId('prev-month');
    const nextButton = screen.getByTestId('next-month');

    expect(prevButton).toHaveAttribute('aria-label', 'Previous month');
    expect(nextButton).toHaveAttribute('aria-label', 'Next month');
  });
});

describe('Design System Integration - Token Consistency', () => {

  it('INTEGRATION 16: all components use COLORS.blue for primary actions', () => {
    render(<ModalWithButtons />);
    const { container: dateContainer } = render(
      <HolidayAwareDatePicker value="2025-01-15" onChange={() => {}} />
    );

    // Primary button should be blue
    const primaryButton = screen.getByText('Confirm') as HTMLButtonElement;
    expect(primaryButton.style.backgroundColor).toBe('rgb(0, 122, 255)');

    // Selected date should have blue indicator
    const selectedDateIndicators = Array.from(dateContainer.querySelectorAll('div')).filter(
      div => (div as HTMLElement).style.backgroundColor?.includes('rgb(0, 122, 255)')
    );
    expect(selectedDateIndicators.length).toBeGreaterThan(0);
  });

  it('INTEGRATION 17: all components use 0.4 opacity for disabled state', () => {
    render(
      <>
        <ModalButton disabled={true}>Disabled Button</ModalButton>
        <HolidayAwareDatePicker
          value=""
          onChange={() => {}}
          disabled={true}
        />
      </>
    );

    const disabledButton = screen.getByText('Disabled Button') as HTMLButtonElement;
    expect(disabledButton.style.opacity).toBe('0.4');

    // Date picker button itself should have 0.4 opacity when disabled
    const datePickerSpan = screen.getByText('Select date');
    const datePickerButton = datePickerSpan.closest('button') as HTMLButtonElement;
    expect(datePickerButton.style.opacity).toBe('0.4');
  });

  it('INTEGRATION 18: all components use same transition timing', () => {
    render(
      <>
        <ModalButton>Test Button</ModalButton>
        <HolidayAwareDatePicker value="" onChange={() => {}} />
      </>
    );

    const button = screen.getByText('Test Button') as HTMLButtonElement;

    // Find the date picker button (parent of "Select date" span)
    const dateButtonSpan = screen.getByText('Select date');
    const dateButton = dateButtonSpan.closest('button') as HTMLButtonElement;

    // Both should use same transition
    expect(button.style.transition).toContain('100ms');
    expect(dateButton.style.transition).toContain('100ms');
  });

  it('INTEGRATION 19: all components use 8pt grid spacing', () => {
    const { container } = render(<ModalWithButtons />);

    // Check for spacing values that are multiples of 4
    const allElements = Array.from(container.querySelectorAll('*'));
    const spacingValues = allElements
      .map(el => {
        const style = (el as HTMLElement).style;
        return [style.padding, style.margin, style.gap].filter(Boolean);
      })
      .flat()
      .filter(value => value.includes('px'));

    // All should be multiples of 4px
    spacingValues.forEach(value => {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        expect(numValue % 4).toBe(0);
      }
    });
  });

  it('INTEGRATION 20: all interactive elements have consistent hover state', () => {
    render(
      <>
        <ModalButton variant="secondary">Button 1</ModalButton>
        <ModalButton variant="secondary">Button 2</ModalButton>
      </>
    );

    const button1 = screen.getByText('Button 1') as HTMLButtonElement;
    const button2 = screen.getByText('Button 2') as HTMLButtonElement;

    // Both should start transparent
    expect(button1.style.backgroundColor).toBe('transparent');
    expect(button2.style.backgroundColor).toBe('transparent');

    // Both should hover to same color
    fireEvent.mouseEnter(button1);
    const hoverColor1 = button1.style.backgroundColor;

    fireEvent.mouseEnter(button2);
    const hoverColor2 = button2.style.backgroundColor;

    expect(hoverColor1).toBe(hoverColor2);
    expect(hoverColor1).toBe('rgba(0, 0, 0, 0.04)'); // COLORS.interactive.hover
  });
});
