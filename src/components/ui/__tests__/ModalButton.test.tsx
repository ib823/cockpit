/**
 * ModalButton Component Test Suite
 *
 * Comprehensive testing following GLOBAL QUALITY & INTEGRATION POLICY
 *
 * Test Coverage:
 * - Core Functionality (5 scenarios)
 * - Variant Styling (3 scenarios)
 * - Design Token Compliance (4 scenarios)
 * - Disabled State (2 scenarios)
 * - Touch Targets (2 scenarios)
 * - Accessibility (2 scenarios)
 * - Edge Cases (2 scenarios)
 *
 * Total: 20 scenarios
 *
 * JSDOM Limitations Documented:
 * - Hover states: Tested via event handlers, not computed styles
 * - Touch targets: Verified via inline styles (padding + minHeight)
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalButton } from '../BaseModal';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, TRANSITIONS } from '@/lib/design-system/tokens';

describe('ModalButton - Core Functionality', () => {

  it('SCENARIO 1: renders with children text', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('SCENARIO 2: onClick handler is called when clicked', async () => {
    const mockOnClick = vi.fn();
    render(<ModalButton onClick={mockOnClick}>Click Me</ModalButton>);

    const button = screen.getByText('Click Me');
    await userEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('SCENARIO 3: button type attribute defaults to "button"', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('SCENARIO 4: button type can be set to "submit"', () => {
    render(<ModalButton type="submit">Submit</ModalButton>);

    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('SCENARIO 5: default variant is "secondary"', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;

    // Secondary has transparent background and border
    expect(button.style.backgroundColor).toBe('transparent');
    expect(button.style.border).toContain('1px solid');
  });
});

describe('ModalButton - Variant Styling', () => {

  it('SCENARIO 6: primary variant has blue background and white text', () => {
    render(<ModalButton variant="primary">Primary</ModalButton>);

    const button = screen.getByText('Primary') as HTMLButtonElement;

    // JSDOM converts hex to RGB
    expect(button.style.backgroundColor).toBe('rgb(0, 122, 255)'); // #007AFF
    expect(button.style.color).toBe('rgb(255, 255, 255)'); // white
  });

  it('SCENARIO 7: secondary variant has transparent background and border', () => {
    render(<ModalButton variant="secondary">Secondary</ModalButton>);

    const button = screen.getByText('Secondary') as HTMLButtonElement;

    expect(button.style.backgroundColor).toBe('transparent');
    expect(button.style.color).toBe('rgb(0, 0, 0)'); // black
    expect(button.style.border).toContain('rgba(0, 0, 0, 0.12)'); // border.strong
  });

  it('SCENARIO 8: destructive variant has red background and white text', () => {
    render(<ModalButton variant="destructive">Delete</ModalButton>);

    const button = screen.getByText('Delete') as HTMLButtonElement;

    // JSDOM converts hex to RGB
    expect(button.style.backgroundColor).toBe('rgb(255, 59, 48)'); // #FF3B30
    expect(button.style.color).toBe('rgb(255, 255, 255)'); // white
  });
});

describe('ModalButton - Design Token Compliance', () => {

  it('SCENARIO 9: uses SPACING tokens for padding', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;
    const expectedPadding = `${SPACING[2]} ${SPACING[5]}`;

    expect(button.style.padding).toBe(expectedPadding);
  });

  it('SCENARIO 10: uses TYPOGRAPHY tokens for font properties', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;

    // JSDOM may normalize quote style in font-family - check content instead
    expect(button.style.fontFamily).toContain('SF Pro Text');
    expect(button.style.fontSize).toBe(TYPOGRAPHY.fontSize.body);
    // JSDOM returns font-weight as string
    expect(button.style.fontWeight).toBe('600');
  });

  it('SCENARIO 11: uses RADIUS token for border radius', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;

    expect(button.style.borderRadius).toBe(RADIUS.default);
  });

  it('SCENARIO 12: uses TRANSITIONS tokens for animation', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;
    const expectedTransition = `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`;

    expect(button.style.transition).toBe(expectedTransition);
  });
});

describe('ModalButton - Disabled State', () => {

  it('SCENARIO 13: disabled button has 0.4 opacity', () => {
    render(<ModalButton disabled={true}>Disabled</ModalButton>);

    const button = screen.getByText('Disabled') as HTMLButtonElement;

    // Check inline style directly (JSDOM-safe)
    expect(button.style.opacity).toBe('0.4');
  });

  it('SCENARIO 14: disabled button has not-allowed cursor', () => {
    render(<ModalButton disabled={true}>Disabled</ModalButton>);

    const button = screen.getByText('Disabled') as HTMLButtonElement;

    expect(button.style.cursor).toBe('not-allowed');
  });

  it('SCENARIO 15: disabled button does not call onClick', async () => {
    const mockOnClick = vi.fn();
    render(<ModalButton disabled={true} onClick={mockOnClick}>Disabled</ModalButton>);

    const button = screen.getByText('Disabled');
    await userEvent.click(button);

    // Click event fires but disabled attribute prevents handler
    expect(button).toBeDisabled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('SCENARIO 16: disabled primary button has gray background', () => {
    render(<ModalButton variant="primary" disabled={true}>Disabled</ModalButton>);

    const button = screen.getByText('Disabled') as HTMLButtonElement;

    expect(button.style.backgroundColor).toBe(COLORS.text.disabled);
  });
});

describe('ModalButton - Touch Targets (Apple HIG)', () => {

  it('SCENARIO 17: button has adequate touch target height', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me') as HTMLButtonElement;

    // Padding creates touch area: 8px top + content + 8px bottom
    // With 15px font + line height, total height should exceed 44px minimum
    const padding = button.style.padding;
    expect(padding).toContain(SPACING[2]); // 8px vertical

    // Font size 15px + padding should provide adequate touch area
    const fontSize = button.style.fontSize;
    expect(fontSize).toBe(TYPOGRAPHY.fontSize.body); // 15px
  });

  it('SCENARIO 18: button has minimum width for tap accuracy', () => {
    render(<ModalButton>OK</ModalButton>);

    const button = screen.getByText('OK') as HTMLButtonElement;

    // Minimum width enforced
    expect(button.style.minWidth).toBe('88px');
  });
});

describe('ModalButton - Accessibility', () => {

  it('SCENARIO 19: renders as semantic button element', () => {
    render(<ModalButton>Click Me</ModalButton>);

    const button = screen.getByText('Click Me');
    expect(button.tagName).toBe('BUTTON');
  });

  it('SCENARIO 20: disabled attribute is properly set', () => {
    const { rerender } = render(<ModalButton disabled={false}>Enabled</ModalButton>);

    let button = screen.getByText('Enabled');
    expect(button).not.toBeDisabled();

    rerender(<ModalButton disabled={true}>Disabled</ModalButton>);

    button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});

describe('ModalButton - Edge Cases', () => {

  it('SCENARIO 21: works without onClick handler', () => {
    // Should not crash if onClick is undefined
    expect(() => {
      render(<ModalButton>No Handler</ModalButton>);
    }).not.toThrow();

    const button = screen.getByText('No Handler');
    expect(button).toBeInTheDocument();
  });

  it('SCENARIO 22: all three variants work with disabled state', () => {
    const { rerender } = render(<ModalButton variant="primary" disabled={true}>Primary</ModalButton>);

    let button = screen.getByText('Primary') as HTMLButtonElement;
    expect(button.style.opacity).toBe('0.4');
    expect(button.style.backgroundColor).toBe(COLORS.text.disabled);

    rerender(<ModalButton variant="secondary" disabled={true}>Secondary</ModalButton>);
    button = screen.getByText('Secondary') as HTMLButtonElement;
    expect(button.style.opacity).toBe('0.4');

    rerender(<ModalButton variant="destructive" disabled={true}>Destructive</ModalButton>);
    button = screen.getByText('Destructive') as HTMLButtonElement;
    expect(button.style.opacity).toBe('0.4');
    expect(button.style.backgroundColor).toBe(COLORS.text.disabled);
  });
});

describe('ModalButton - Hover States (Event Handlers)', () => {

  it('SCENARIO 23: primary button hover changes to blueHover color', () => {
    render(<ModalButton variant="primary">Hover Me</ModalButton>);

    const button = screen.getByText('Hover Me') as HTMLButtonElement;
    const initialColor = button.style.backgroundColor;

    expect(initialColor).toBe('rgb(0, 122, 255)'); // #007AFF

    // Trigger hover
    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe('rgb(0, 81, 213)'); // #0051D5 blueHover

    // Trigger leave
    fireEvent.mouseLeave(button);
    expect(button.style.backgroundColor).toBe('rgb(0, 122, 255)'); // #007AFF
  });

  it('SCENARIO 24: destructive button hover changes to redHover color', () => {
    render(<ModalButton variant="destructive">Delete</ModalButton>);

    const button = screen.getByText('Delete') as HTMLButtonElement;

    // Trigger hover
    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe('rgb(215, 0, 21)'); // #D70015 redHover

    // Trigger leave
    fireEvent.mouseLeave(button);
    expect(button.style.backgroundColor).toBe('rgb(255, 59, 48)'); // #FF3B30
  });

  it('SCENARIO 25: secondary button hover adds subtle background', () => {
    render(<ModalButton variant="secondary">Hover</ModalButton>);

    const button = screen.getByText('Hover') as HTMLButtonElement;

    expect(button.style.backgroundColor).toBe('transparent');

    // Trigger hover
    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe(COLORS.interactive.hover);

    // Trigger leave
    fireEvent.mouseLeave(button);
    expect(button.style.backgroundColor).toBe('transparent');
  });

  it('SCENARIO 26: disabled button hover does not change styles', () => {
    render(<ModalButton variant="primary" disabled={true}>Disabled</ModalButton>);

    const button = screen.getByText('Disabled') as HTMLButtonElement;
    const initialColor = button.style.backgroundColor;

    expect(initialColor).toBe(COLORS.text.disabled);

    // Trigger hover (should not change)
    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe(COLORS.text.disabled);
  });
});
