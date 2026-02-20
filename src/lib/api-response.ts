/**
 * F-03: Standardized API Response Utilities
 *
 * Canonical response helpers for consistent error/success envelopes.
 * All new API routes SHOULD use these helpers.
 */

import { NextResponse } from "next/server";
import { ValidationError } from "./api-validators";

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/** 400 Bad Request — validation failure with field-level errors */
export function badRequest(message: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json(
    { error: message, ...(fieldErrors ? { fieldErrors } : {}) },
    { status: 400 }
  );
}

/** 401 Unauthorized — no session or expired token */
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** 403 Forbidden — authenticated but insufficient permissions */
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** 404 Not Found */
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** 409 Conflict — duplicate resource or race condition */
export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

/** 500 Internal Server Error — safe generic message, never expose internals */
export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

/**
 * Convert a ValidationError to a standardized 400 response.
 * Use in catch blocks after calling validateRequest().
 */
export function validationErrorResponse(err: ValidationError) {
  return badRequest("Validation failed", err.fieldErrors);
}

/**
 * Handle any error in an API route catch block.
 * Returns a safe response — never exposes stack traces or internals.
 */
export function handleApiError(err: unknown) {
  if (err instanceof ValidationError) {
    return validationErrorResponse(err);
  }

  // Log for debugging but return safe message
  console.error("[API Error]", err);
  return serverError();
}
