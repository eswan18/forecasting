import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: number;
  operation?: string;
  table?: string;
  recordId?: number | string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;

    // In production, only log info and above
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    console.debug(this.formatMessage("debug", message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog("error")) return;

    const fullContext = {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    console.error(this.formatMessage("error", message, fullContext));

    // Send to Sentry in production
    if (!this.isDevelopment && error) {
      Sentry.captureException(error, {
        tags: context,
        extra: context,
      });
    }
  }

  // Specialized methods for database operations
  dbOperation(
    operation: string,
    table: string,
    context?: Omit<LogContext, "operation" | "table">,
  ): void {
    this.info(`Database operation: ${operation}`, {
      operation,
      table,
      ...context,
    });
  }

  dbError(
    operation: string,
    table: string,
    error: Error,
    context?: Omit<LogContext, "operation" | "table">,
  ): void {
    this.error(`Database operation failed: ${operation}`, error, {
      operation,
      table,
      ...context,
    });
  }

  dbPerformance(
    operation: string,
    table: string,
    duration: number,
    context?: Omit<LogContext, "operation" | "table" | "duration">,
  ): void {
    const level = duration > 1000 ? "warn" : "info";
    const message = `Database operation completed: ${operation} (${duration}ms)`;

    if (level === "warn") {
      this.warn(message, {
        operation,
        table,
        duration,
        ...context,
      });
    } else {
      this.info(message, {
        operation,
        table,
        duration,
        ...context,
      });
    }
  }
}

export const logger = new Logger();
