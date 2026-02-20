/**
 * G-01: Structured Logger Contract Tests
 *
 * Validates the canonical logger utility produces correct output
 * format, respects log levels, and safely serializes errors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the module by importing the factory — since the logger reads
// process.env at call time, we can control behavior via env vars.
let loggerModule: typeof import("@/lib/logger");

beforeEach(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  // Fresh import each time to pick up env changes
  vi.resetModules();
  loggerModule = await import("@/lib/logger");
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LOG_LEVEL;
});

describe("Structured Logger", () => {
  describe("log level methods", () => {
    it("exposes all five log level methods", () => {
      const { logger } = loggerModule;
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.fatal).toBe("function");
    });

    it("exposes child() factory", () => {
      const { logger } = loggerModule;
      expect(typeof logger.child).toBe("function");
      const child = logger.child("TestModule");
      expect(typeof child.info).toBe("function");
      expect(typeof child.child).toBe("function");
    });
  });

  describe("output routing", () => {
    it("routes info to console.log", () => {
      loggerModule.logger.info("test message");
      expect(console.log).toHaveBeenCalled();
    });

    it("routes warn to console.warn", () => {
      loggerModule.logger.warn("test warning");
      expect(console.warn).toHaveBeenCalled();
    });

    it("routes error to console.error", () => {
      loggerModule.logger.error("test error");
      expect(console.error).toHaveBeenCalled();
    });

    it("routes fatal to console.error", () => {
      loggerModule.logger.fatal("critical failure");
      expect(console.error).toHaveBeenCalled();
    });

    it("routes debug to console.log", () => {
      loggerModule.logger.debug("debug info");
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("child loggers", () => {
    it("includes module name in output", () => {
      const child = loggerModule.logger.child("TestModule");
      child.info("hello");
      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain("TestModule");
    });

    it("supports nested child loggers", () => {
      const child = loggerModule.logger.child("Parent").child("Child");
      child.info("nested");
      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain("Parent.Child");
    });
  });

  describe("structured data", () => {
    it("passes data object alongside message", () => {
      loggerModule.logger.info("created", { projectId: "abc", count: 5 });
      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      // In dev mode, data is passed as second argument
      expect(call[1]).toEqual({ projectId: "abc", count: 5 });
    });

    it("handles missing data gracefully", () => {
      loggerModule.logger.info("no data");
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });

  describe("error serialization", () => {
    it("serializes Error objects in data.error", () => {
      const err = new Error("boom");
      loggerModule.logger.error("failed", { error: err });
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const data = call[1];
      expect(data.error).toHaveProperty("name", "Error");
      expect(data.error).toHaveProperty("message", "boom");
    });

    it("includes stack trace in development", () => {
      const err = new Error("boom");
      loggerModule.logger.error("failed", { error: err });
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1].error).toHaveProperty("stack");
    });

    it("serializes non-Error values in data.error", () => {
      loggerModule.logger.error("failed", { error: "string error" });
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1].error).toHaveProperty("raw", "string error");
    });
  });

  describe("log level filtering", () => {
    it("suppresses debug when LOG_LEVEL=info", async () => {
      process.env.LOG_LEVEL = "info";
      vi.resetModules();
      const mod = await import("@/lib/logger");
      mod.logger.debug("should be suppressed");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("allows warn when LOG_LEVEL=warn", async () => {
      process.env.LOG_LEVEL = "warn";
      vi.resetModules();
      const mod = await import("@/lib/logger");
      mod.logger.warn("should appear");
      expect(console.warn).toHaveBeenCalled();
    });

    it("suppresses info when LOG_LEVEL=warn", async () => {
      process.env.LOG_LEVEL = "warn";
      vi.resetModules();
      const mod = await import("@/lib/logger");
      mod.logger.info("should be suppressed");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("always allows error when LOG_LEVEL=error", async () => {
      process.env.LOG_LEVEL = "error";
      vi.resetModules();
      const mod = await import("@/lib/logger");
      mod.logger.error("should appear");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("type exports", () => {
    it("exports LogLevel type values", () => {
      // Verify the type system by checking the level priority is accessible
      const levels: import("@/lib/logger").LogLevel[] = [
        "debug",
        "info",
        "warn",
        "error",
        "fatal",
      ];
      expect(levels).toHaveLength(5);
    });

    it("exports Logger interface shape", () => {
      const log: import("@/lib/logger").Logger = loggerModule.logger;
      expect(log).toBeDefined();
    });
  });
});
