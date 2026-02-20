/**
 * F-03: API Response Envelope Contract Tests
 *
 * Verifies that response utilities produce consistent shapes and status codes.
 */

import { describe, it, expect, vi } from "vitest";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  validationErrorResponse,
  handleApiError,
} from "@/lib/api-response";
import { ValidationError } from "@/lib/api-validators";

async function parseResponse(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("API Response Utilities", () => {
  describe("badRequest", () => {
    it("returns 400 with error message", async () => {
      const { status, body } = await parseResponse(badRequest("Invalid input"));
      expect(status).toBe(400);
      expect(body.error).toBe("Invalid input");
    });

    it("includes fieldErrors when provided", async () => {
      const { body } = await parseResponse(
        badRequest("Validation failed", { name: ["Name required"] })
      );
      expect(body.fieldErrors).toEqual({ name: ["Name required"] });
    });

    it("omits fieldErrors when not provided", async () => {
      const { body } = await parseResponse(badRequest("Bad data"));
      expect(body.fieldErrors).toBeUndefined();
    });
  });

  describe("unauthorized", () => {
    it("returns 401 with default message", async () => {
      const { status, body } = await parseResponse(unauthorized());
      expect(status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("accepts custom message", async () => {
      const { body } = await parseResponse(unauthorized("Session expired"));
      expect(body.error).toBe("Session expired");
    });
  });

  describe("forbidden", () => {
    it("returns 403 with default message", async () => {
      const { status, body } = await parseResponse(forbidden());
      expect(status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("notFound", () => {
    it("returns 404 with default message", async () => {
      const { status, body } = await parseResponse(notFound());
      expect(status).toBe(404);
      expect(body.error).toBe("Not found");
    });

    it("accepts custom message", async () => {
      const { body } = await parseResponse(notFound("Project not found"));
      expect(body.error).toBe("Project not found");
    });
  });

  describe("conflict", () => {
    it("returns 409 with message", async () => {
      const { status, body } = await parseResponse(conflict("Email already exists"));
      expect(status).toBe(409);
      expect(body.error).toBe("Email already exists");
    });
  });

  describe("serverError", () => {
    it("returns 500 with safe default message", async () => {
      const { status, body } = await parseResponse(serverError());
      expect(status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    it("never exposes stack traces in default message", async () => {
      const { body } = await parseResponse(serverError());
      expect(body.error).not.toContain("at ");
      expect(body.error).not.toContain("Error:");
    });
  });

  describe("validationErrorResponse", () => {
    it("converts ValidationError to 400 with fieldErrors", async () => {
      const err = new ValidationError("Validation failed", {
        name: ["Name required"],
        email: ["Invalid email"],
      });
      const { status, body } = await parseResponse(validationErrorResponse(err));
      expect(status).toBe(400);
      expect(body.error).toBe("Validation failed");
      expect(body.fieldErrors.name).toEqual(["Name required"]);
      expect(body.fieldErrors.email).toEqual(["Invalid email"]);
    });
  });

  describe("handleApiError", () => {
    it("handles ValidationError with 400", async () => {
      const err = new ValidationError("Bad", { x: ["y"] });
      const { status } = await parseResponse(handleApiError(err));
      expect(status).toBe(400);
    });

    it("handles unknown errors with 500", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { status, body } = await parseResponse(handleApiError(new Error("db crash")));
      expect(status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(body.error).not.toContain("db crash");
      spy.mockRestore();
    });

    it("logs unknown errors to console", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      handleApiError(new Error("something broke"));
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

describe("Error response shape contract", () => {
  it("all error responses have the same shape: { error: string }", async () => {
    const responses = [
      badRequest("test"),
      unauthorized(),
      forbidden(),
      notFound(),
      conflict("test"),
      serverError(),
    ];

    for (const res of responses) {
      const body = await res.json();
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    }
  });

  it("no error response leaks stack traces or internal details", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const responses = [
      badRequest("test"),
      unauthorized(),
      forbidden(),
      notFound(),
      serverError(),
      handleApiError(new TypeError("cannot read property x of undefined")),
    ];

    for (const res of responses) {
      const body = await res.json();
      expect(body.error).not.toMatch(/at \w+/);
      expect(body.error).not.toContain("undefined");
      expect(body.stack).toBeUndefined();
    }
    spy.mockRestore();
  });
});
