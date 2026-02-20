/**
 * Structured Logger — Canonical logging utility for Cockpit
 *
 * All server-side logging should use this module instead of raw console calls.
 * Outputs JSON in production for log aggregation; pretty-prints in development.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Project created", { projectId, userId });
 *   logger.error("Failed to save", { error: err, projectId });
 *
 * Child loggers for module context:
 *   const log = logger.child("BackgroundSync");
 *   log.info("Sync started", { projectId });
 *   // outputs: {"level":"info","module":"BackgroundSync","msg":"Sync started",...}
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/** Minimum log level from environment. Defaults to "debug" in dev, "info" in production. */
function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LOG_LEVEL_PRIORITY) return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

/** Safely extract serializable error info without leaking stack traces in production. */
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const base: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    if (process.env.NODE_ENV !== "production") {
      base.stack = err.stack;
    }
    if ("code" in err) base.code = (err as Record<string, unknown>).code;
    return base;
  }
  return { raw: String(err) };
}

export interface LogEntry {
  level: LogLevel;
  msg: string;
  module?: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  fatal(msg: string, data?: Record<string, unknown>): void;
  child(module: string): Logger;
}

function createLogger(module?: string): Logger {
  const minLevel = getMinLevel();
  const isDev = process.env.NODE_ENV !== "production";

  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  }

  function emit(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (!shouldLog(level)) return;

    // Normalize error objects in data
    const normalized = data ? { ...data } : {};
    if (normalized.error !== undefined) {
      normalized.error = serializeError(normalized.error);
    }

    const entry: LogEntry = {
      level,
      msg,
      timestamp: new Date().toISOString(),
      ...(module ? { module } : {}),
      ...normalized,
    };

    if (isDev) {
      // Human-readable output in development
      const prefix = module ? `[${module}]` : "";
      const tag = `[${level.toUpperCase()}]`;
      const extra = Object.keys(normalized).length > 0 ? normalized : undefined;
      switch (level) {
        case "error":
        case "fatal":
          console.error(`${tag} ${prefix} ${msg}`.trim(), ...(extra ? [extra] : []));
          break;
        case "warn":
          console.warn(`${tag} ${prefix} ${msg}`.trim(), ...(extra ? [extra] : []));
          break;
        default:
          console.log(`${tag} ${prefix} ${msg}`.trim(), ...(extra ? [extra] : []));
      }
    } else {
      // Structured JSON output in production (one line per entry for log aggregation)
      const line = JSON.stringify(entry);
      switch (level) {
        case "error":
        case "fatal":
          console.error(line);
          break;
        case "warn":
          console.warn(line);
          break;
        default:
          console.log(line);
      }
    }
  }

  return {
    debug: (msg, data) => emit("debug", msg, data),
    info: (msg, data) => emit("info", msg, data),
    warn: (msg, data) => emit("warn", msg, data),
    error: (msg, data) => emit("error", msg, data),
    fatal: (msg, data) => emit("fatal", msg, data),
    child: (childModule: string) => createLogger(module ? `${module}.${childModule}` : childModule),
  };
}

/** Root logger instance. Use `logger.child("ModuleName")` for scoped loggers. */
export const logger = createLogger();
