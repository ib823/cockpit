/**
 * Sample Unit Tests for HolidayAwareDatePicker
 *
 * This is a sample file showing the testing approach.
 * Full implementation would include all 168 test scenarios from the test matrix.
 *
 * To run: npm test HolidayAwareDatePicker.sample.test.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HolidayAwareDatePicker } from '@/components/ui/HolidayAwareDatePicker';
import '@testing-library/jest-dom';

describe('HolidayAwareDatePicker - Core Functionality', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: '2025-01-15',
    onChange: mockOnChange,
    region: 'ABMY' as const,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with label when provided', () => {
      render(<HolidayAwareDatePicker {...defaultProps} label="Start Date" />);
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('should render required asterisk when required=true', () => {
      render(<HolidayAwareDatePicker {...defaultProps} label="Start Date" required={true} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display selected date in button', () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument();
    });

    it('should show placeholder when no value', () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="" placeholder="Pick a date" />);
      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });
  });

  describe('Calendar Interaction', () => {
    it('should open calendar when button clicked', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
      });
    });

    it('should close calendar on outside click', async () => {
      const { container } = render(<HolidayAwareDatePicker {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText(/January 2025/i)).not.toBeInTheDocument();
      });
    });

    it('should navigate to next month', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByTitle(/next/i);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/February 2025/i)).toBeInTheDocument();
      });
    });

    it('should navigate to previous month', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
      });

      const prevButton = screen.getByTitle(/previous/i);
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/December 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('Holiday Detection', () => {
    it('should mark Malaysia New Year as holiday', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-01" region="ABMY" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const jan1 = screen.getByText('1');
        expect(jan1.parentElement).toHaveClass('bg-red-50');
      });
    });

    it('should show holiday warning when holiday selected', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-01" region="ABMY" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Public Holiday/i)).toBeInTheDocument();
        expect(screen.getByText(/New Year's Day/i)).toBeInTheDocument();
      });
    });

    it('should offer next working day suggestion for holiday', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-01" region="ABMY" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Use Next Working Day/i)).toBeInTheDocument();
      });
    });

    it('should change to next working day when suggestion clicked', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-01" region="ABMY" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const suggestion = screen.getByText(/Use Next Working Day/i);
        fireEvent.click(suggestion);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringMatching(/2025-01-02/));
      });
    });
  });

  describe('Weekend Detection', () => {
    it('should highlight weekends in amber', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-04" />); // Saturday
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const sat = screen.getByText('4');
        expect(sat.parentElement).toHaveClass('bg-amber-50');
      });
    });

    it('should show weekend warning when weekend selected', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="2025-01-04" />); // Saturday
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Weekend Selected/i)).toBeInTheDocument();
        expect(screen.getByText(/Saturday/i)).toBeInTheDocument();
      });
    });
  });

  describe('Region Support', () => {
    it('should show Malaysia holidays for ABMY region', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} region="ABMY" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/🇲🇾 Malaysia/i)).toBeInTheDocument();
      });
    });

    it('should show Singapore holidays for ABSG region', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} region="ABSG" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/🇸🇬 Singapore/i)).toBeInTheDocument();
      });
    });

    it('should show Vietnam holidays for ABVN region', async () => {
      render(<HolidayAwareDatePicker {...defaultProps} region="ABVN" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/🇻🇳 Vietnam/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Constraints', () => {
    it('should disable dates before minDate', async () => {
      render(
        <HolidayAwareDatePicker
          {...defaultProps}
          value="2025-01-15"
          minDate="2025-01-10"
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const jan9 = screen.getByText('9');
        expect(jan9.parentElement).toBeDisabled();
      });
    });

    it('should disable dates after maxDate', async () => {
      render(
        <HolidayAwareDatePicker
          {...defaultProps}
          value="2025-01-15"
          maxDate="2025-01-20"
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const jan21 = screen.getByText('21');
        expect(jan21.parentElement).toBeDisabled();
      });
    });

    it('should allow dates within range', async () => {
      render(
        <HolidayAwareDatePicker
          {...defaultProps}
          value="2025-01-15"
          minDate="2025-01-10"
          maxDate="2025-01-20"
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const jan15 = screen.getByText('15');
        expect(jan15.parentElement).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should have proper ARIA labels', () => {
      render(<HolidayAwareDatePicker {...defaultProps} label="Start Date" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Start Date'));
    });

    it('should indicate required state', () => {
      render(<HolidayAwareDatePicker {...defaultProps} label="Start Date" required={true} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when date is selected', () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      expect(screen.getByTitle(/clear/i)).toBeInTheDocument();
    });

    it('should clear date when clear button clicked', () => {
      render(<HolidayAwareDatePicker {...defaultProps} />);
      const clearButton = screen.getByTitle(/clear/i);
      fireEvent.click(clearButton);
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should not show clear button when no date selected', () => {
      render(<HolidayAwareDatePicker {...defaultProps} value="" />);
      expect(screen.queryByTitle(/clear/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<HolidayAwareDatePicker {...defaultProps} error="Date is required" />);
      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });

    it('should apply error styling when error present', () => {
      render(<HolidayAwareDatePicker {...defaultProps} error="Date is required" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-red-300');
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled=true', () => {
      render(<HolidayAwareDatePicker {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not open calendar when disabled', () => {
      render(<HolidayAwareDatePicker {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.queryByText(/January 2025/i)).not.toBeInTheDocument();
    });
  });
});

/**
 * Additional Test Scenarios to Implement:
 *
 * 1. Performance Tests (8 scenarios)
 *    - Large date ranges (10+ years)
 *    - Rapid month navigation
 *    - Multiple pickers on same page
 *    - Memory leak detection
 *
 * 2. Edge Cases (18 scenarios)
 *    - Year boundaries (Dec 31 → Jan 1)
 *    - Leap years
 *    - Invalid date strings
 *    - Null/undefined values
 *    - Extreme dates (year 1900, 2100)
 *
 * 3. Integration Tests (25 scenarios)
 *    - Working with forms
 *    - Multiple pickers interacting
 *    - Dynamic region switching
 *    - Props updates while open
 *
 * 4. Visual Regression Tests (12 scenarios)
 *    - Calendar appearance
 *    - Holiday markers
 *    - Weekend highlighting
 *    - Warning messages
 *
 * TOTAL: 168 test scenarios as per test matrix
 */
