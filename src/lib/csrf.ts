/**
 * CSRF Protection
 * SECURITY: Double-submit cookie pattern for stateless CSRF protection
 * Protects against cross-site request forgery attacks
 */

import { timingSafeEqual as cryptoTimingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const CSRF_FORM_FIELD = "csrf_token";
const TOKEN_LENGTH = 32; // 256 bits

/**
 * Generate a new CSRF token and set it as a cookie
 * Call this when creating a new session
 */
export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(TOKEN_LENGTH).toString("hex");

  const store = await cookies();
  store.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Get the current CSRF token from cookies
 * Used to include the token in forms or request headers
 */
export async function getCsrfToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value || null;
}

/**
 * Validate CSRF token from request
 * Checks both header and form field, uses timing-safe comparison
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;

  if (!cookieToken) {
    console.warn("[CSRF] No CSRF cookie found");
    return false;
  }

  // Check header first (preferred for API calls)
  let requestToken = request.headers.get(CSRF_HEADER);

  // If not in header, check form field (for traditional form submissions)
  if (
    !requestToken &&
    request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")
  ) {
    try {
      const formData = await request.clone().formData();
      requestToken = formData.get(CSRF_FORM_FIELD) as string;
    } catch {
      // Not a form submission, token must be in header
    }
  }

  if (!requestToken) {
    console.warn("[CSRF] No CSRF token in request");
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const cookieBuffer = Buffer.from(cookieToken);
    const requestBuffer = Buffer.from(requestToken);

    if (cookieBuffer.length !== requestBuffer.length) {
      return false;
    }

    return cryptoTimingSafeEqual(cookieBuffer, requestBuffer);
  } catch (error) {
    console.error("[CSRF] Token comparison failed:", error);
    return false;
  }
}

/**
 * Require valid CSRF token or throw error
 * Use this in API route handlers for state-changing operations
 */
export async function requireCsrf(request: Request): Promise<void> {
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    throw new Error("CSRF validation failed");
  }
}

/**
 * Check if request method requires CSRF protection
 * GET, HEAD, and OPTIONS are safe methods that don't require protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Middleware helper: Validate CSRF for state-changing requests
 * Returns error response if validation fails
 */
export async function csrfMiddleware(request: Request): Promise<Response | null> {
  if (!requiresCsrfProtection(request.method)) {
    return null; // No protection needed for safe methods
  }

  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    console.warn("[SECURITY] CSRF validation failed", {
      method: request.method,
      url: request.url,
      hasHeader: !!request.headers.get(CSRF_HEADER),
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: false,
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null; // Validation passed
}

/**
 * Client-side helper: Get CSRF token for inclusion in requests
 * Export this for use in frontend API calls
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((c) => c.trim().startsWith(`${CSRF_COOKIE}=`));

  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split("=")[1].trim();
}
