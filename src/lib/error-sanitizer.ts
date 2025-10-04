// src/lib/error-sanitizer.ts
// Error message sanitization for production
// SECURITY: Prevents information disclosure through error messages

export type ErrorType =
  | "ValidationError"
  | "CalculationError"
  | "ParsingError"
  | "NetworkError"
  | "AuthError"
  | "StorageError"
  | "Unknown";

/**
 * Sanitize error messages to prevent information disclosure
 * @param error - The error object or message
 * @param errorType - Optional error type for better categorization
 * @returns User-safe error message
 */
export function sanitizeError(error: unknown, errorType?: ErrorType): string {
  // In development, show full error details
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return String(error);
  }

  // In production, return generic messages based on error type
  if (errorType) {
    return getGenericMessage(errorType);
  }

  // Try to infer error type from error object
  if (error instanceof Error) {
    const inferredType = inferErrorType(error);
    return getGenericMessage(inferredType);
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get generic user-safe message for error type
 */
function getGenericMessage(errorType: ErrorType): string {
  const messages: Record<ErrorType, string> = {
    ValidationError: "The input provided is invalid. Please check and try again.",
    CalculationError: "Unable to process the calculation. Please verify your data.",
    ParsingError: "Unable to parse the document. Please check the format.",
    NetworkError: "Network error occurred. Please check your connection.",
    AuthError: "Authentication failed. Please log in again.",
    StorageError: "Unable to save data. Please check your browser settings.",
    Unknown: "An unexpected error occurred. Please try again.",
  };

  return messages[errorType];
}

/**
 * Infer error type from error object
 */
function inferErrorType(error: Error): ErrorType {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  if (errorName.includes("validation") || errorMessage.includes("invalid")) {
    return "ValidationError";
  }
  if (errorName.includes("syntax") || errorMessage.includes("parse")) {
    return "ParsingError";
  }
  if (errorName.includes("network") || errorMessage.includes("fetch")) {
    return "NetworkError";
  }
  if (errorName.includes("auth") || errorMessage.includes("unauthorized")) {
    return "AuthError";
  }
  if (errorMessage.includes("storage") || errorMessage.includes("quota")) {
    return "StorageError";
  }
  if (errorMessage.includes("calculation") || errorMessage.includes("nan")) {
    return "CalculationError";
  }

  return "Unknown";
}

/**
 * Check if error is safe to show to user
 * Some errors can be shown directly (e.g., validation errors)
 */
export function isUserSafeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const safeErrors = ["ValidationError", "UserInputError", "ClientError"];

  return safeErrors.some((safe) => error.name.includes(safe));
}

/**
 * Log error securely (sanitized for production)
 */
export function logSecureError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]`, error);
  } else {
    // In production, log minimal info
    console.error(`[${context}] Error occurred`, {
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.name : "Unknown",
    });

    // Send to error tracking service (Sentry, etc.)
    if (typeof window !== "undefined") {
      // window.Sentry?.captureException(error, { tags: { context } });
    }
  }
}
