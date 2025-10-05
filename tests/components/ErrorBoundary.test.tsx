// Test suite for ErrorBoundary component
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React from "react";

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test crash");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error during tests to avoid noise
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Error Catching", () => {
    it("catches errors and shows fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("renders children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Child content")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });

    it("displays custom fallback UI when provided", () => {
      const customFallback = <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it('resets error state when "Try Again" is clicked', () => {
      let shouldThrow = true;

      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error("Test crash");
        }
        return <div>Success!</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      // Error state shown
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click "Try Again" to reset error boundary
      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      // Should show children again after reset
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });
  });

  describe("Development vs Production Behavior", () => {
    it("shows error details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "development";

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should show error message
      expect(screen.getByText(/Test crash/)).toBeInTheDocument();

      // Should have stack trace details
      expect(screen.getByText("Stack trace")).toBeInTheDocument();

      (process.env as any).NODE_ENV = originalEnv;
    });

    it("hides error details in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should show generic error UI
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Should NOT show error details
      expect(screen.queryByText(/Test crash/)).not.toBeInTheDocument();
      expect(screen.queryByText("Stack trace")).not.toBeInTheDocument();

      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe("Error Logging", () => {
    it("logs error to console.error", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      // React calls console.error multiple times, find the one with our message
      const errorCall = consoleErrorSpy.mock.calls.find((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("ErrorBoundary caught an error"))
      );
      expect(errorCall).toBeDefined();
    });

    it("captures error object and component stack", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Console.error should be called with error and errorInfo
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls.find((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("ErrorBoundary caught an error"))
      );

      expect(errorCall).toBeDefined();
      // The error and errorInfo are logged after the message
      expect((errorCall as any)[1]).toBeInstanceOf(Error);
      expect((errorCall as any)[1].message).toBe("Test crash");
      expect((errorCall as any)[2]).toHaveProperty("componentStack");
    });
  });

  describe("Navigation Actions", () => {
    it('navigates to home when "Go Home" is clicked', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: "" } as any;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByText("Go Home");
      fireEvent.click(goHomeButton);

      expect(window.location.href).toBe("/");

      // Restore
      (window as any).location = originalLocation;
    });
  });

  describe("Multiple Errors", () => {
    it("handles consecutive errors correctly", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Reset
      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      // Re-render with different error
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should still show error UI
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("Nested ErrorBoundaries", () => {
    it("inner boundary catches error before outer boundary", () => {
      render(
        <ErrorBoundary fallback={<div>Outer Error</div>}>
          <div>Outer content</div>
          <ErrorBoundary fallback={<div>Inner Error</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText("Inner Error")).toBeInTheDocument();
      expect(screen.queryByText("Outer Error")).not.toBeInTheDocument();
      expect(screen.getByText("Outer content")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("documents that event handler errors are not caught", () => {
      // Note: ErrorBoundary doesn't catch errors in event handlers (React limitation)
      // This test documents this known behavior

      const BuggyButton = () => {
        const [shouldThrow, setShouldThrow] = React.useState(false);

        if (shouldThrow) {
          throw new Error("State update error");
        }

        return <button onClick={() => setShouldThrow(true)}>Click me</button>;
      };

      render(
        <ErrorBoundary>
          <BuggyButton />
        </ErrorBoundary>
      );

      const button = screen.getByText("Click me");
      fireEvent.click(button);

      // Error boundary WILL catch this because the error is thrown during render
      // (not directly in the event handler, but in the state update that triggers re-render)
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("handles async errors during component update", () => {
      const AsyncError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error("Async update error");
        }
        return <div>Success</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <AsyncError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Success")).toBeInTheDocument();

      // Trigger error on re-render
      rerender(
        <ErrorBoundary>
          <AsyncError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("handles null or undefined children gracefully", () => {
      const { rerender } = render(<ErrorBoundary>{null}</ErrorBoundary>);

      // Should not crash with null children
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

      rerender(<ErrorBoundary>{undefined}</ErrorBoundary>);

      // Should not crash with undefined children
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });

    it("handles errors with empty message", () => {
      const EmptyErrorComponent = () => {
        throw new Error("");
      };

      render(
        <ErrorBoundary>
          <EmptyErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("handles non-Error objects thrown", () => {
      const ThrowString = () => {
        throw "String error";
      };

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("UI Accessibility", () => {
    it("has accessible error UI elements", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for heading
      const heading = screen.getByText("Something went wrong");
      expect(heading.tagName).toBe("H2");

      // Check for buttons
      const tryAgainButton = screen.getByText("Try Again");
      const goHomeButton = screen.getByText("Go Home");

      expect(tryAgainButton.tagName).toBe("BUTTON");
      expect(goHomeButton.tagName).toBe("BUTTON");
    });

    it("includes error icon in UI", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for SVG icon
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon?.classList.contains("text-red-600")).toBe(true);
    });
  });

  describe("State Management", () => {
    it("initializes with correct default state", () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test</div>
        </ErrorBoundary>
      );

      // Should render children (no error state)
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("updates state correctly when error is caught", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // State should be updated to show error UI
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("clears state correctly on reset", () => {
      let shouldThrow = true;

      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error("Test crash");
        }
        return <div>Recovered</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      // Error state
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Reset
      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      // State should be cleared
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
      expect(screen.getByText("Recovered")).toBeInTheDocument();
    });
  });

  describe("Production Error Tracking", () => {
    it("should prepare for error tracking integration", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // In production, error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // TODO: In future, verify Sentry/error tracking service call
      // This test documents the planned integration point

      (process.env as any).NODE_ENV = originalEnv;
    });
  });
});
