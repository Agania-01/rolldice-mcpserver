/**
 * Structured Logging System
 * 
 * Provides consistent logging across the application with structured JSON output
 * Includes request tracking, security events, and error logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Format log entry as structured JSON
   */
  private formatLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = this.sanitizeContext(context);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    }

    return entry;
  }

  /**
   * Remove sensitive data from log context
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...context };
    
    // List of keys that should never be logged
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "authorization",
      "cookie",
      "access_token",
      "refresh_token",
      "id_token",
      "client_secret",
    ];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  /**
   * Write log to output
   */
  private write(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    
    switch (entry.level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        if (!this.isProduction) {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write(this.formatLog("debug", message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write(this.formatLog("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write(this.formatLog("warn", message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.write(this.formatLog("error", message, context, error));
  }

  /**
   * Log HTTP request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    durationMs?: number,
    context?: Record<string, unknown>
  ): void {
    this.info("HTTP Request", {
      method,
      path,
      statusCode,
      durationMs,
      ...context,
    });
  }

  /**
   * Log security event
   */
  security(
    event: string,
    details: Record<string, unknown>,
    severity: "info" | "warn" | "error" = "warn"
  ): void {
    const context = {
      securityEvent: true,
      ...details,
    };
    
    if (severity === "info") {
      this.info(`Security Event: ${event}`, context);
    } else if (severity === "warn") {
      this.warn(`Security Event: ${event}`, context);
    } else {
      this.error(`Security Event: ${event}`, undefined, context);
    }
  }

  /**
   * Log OAuth event
   */
  oauth(
    event: string,
    details: Record<string, unknown>
  ): void {
    this.info(`OAuth: ${event}`, {
      oauthEvent: true,
      ...details,
    });
  }

  /**
   * Log MCP protocol event
   */
  mcp(
    event: string,
    details: Record<string, unknown>
  ): void {
    this.debug(`MCP: ${event}`, {
      mcpEvent: true,
      ...details,
    });
  }

  /**
   * Log Arcjet security decision
   */
  arcjet(
    decision: string,
    ip: string,
    path: string,
    reason?: string
  ): void {
    const level = decision === "DENY" ? "warn" : "debug";
    this[level](`Arcjet Decision: ${decision}`, {
      arcjetEvent: true,
      ip,
      path,
      reason,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
