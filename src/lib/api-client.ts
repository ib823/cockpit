/**
 * API Client with CSRF Protection (Client-Side Only)
 *
 * Provides a fetch wrapper that automatically includes CSRF tokens
 * for all state-changing requests (POST, PATCH, PUT, DELETE).
 *
 * Note: This file must NOT import from csrf.ts as that uses next/headers
 * which is server-only. Cookie reading is done directly via document.cookie.
 */

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Get CSRF token from browser cookie (client-side only)
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch wrapper that automatically includes CSRF token for state-changing requests
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing methods
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers.set(CSRF_HEADER, csrfToken);
    }
  }

  // Ensure Content-Type is set for JSON requests
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for POST requests with JSON body
 */
export async function apiPost<T = unknown>(
  url: string,
  data: unknown
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const response = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: json.error || json.message || "Request failed",
        status: response.status,
      };
    }

    return { ok: true, data: json as T, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}

/**
 * Helper for PATCH requests with JSON body
 */
export async function apiPatch<T = unknown>(
  url: string,
  data: unknown
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const response = await apiFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: json.error || json.message || "Request failed",
        status: response.status,
      };
    }

    return { ok: true, data: json as T, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete<T = unknown>(
  url: string,
  data?: unknown
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const options: RequestInit = {
      method: "DELETE",
    };

    if (data) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }

    const response = await apiFetch(url, options);
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: json.error || json.message || "Request failed",
        status: response.status,
      };
    }

    return { ok: true, data: json as T, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}
