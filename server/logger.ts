import { storage } from "./storage";
import type { InsertLog, LogLevel } from "@shared/schema";

interface LogContext {
  userId?: string;
  requestId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private async writeLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    try {
      const logEntry: InsertLog = {
        level,
        message,
        source: context?.source,
        userId: context?.userId,
        requestId: context?.requestId,
        metadata: context?.metadata ? JSON.stringify(context.metadata) : undefined,
        stack: error?.stack,
      };
      
      await storage.createLog(logEntry);
    } catch (err) {
      console.error("Failed to write log:", err);
    }
  }

  async error(message: string, context?: LogContext, error?: Error) {
    console.error(`[ERROR] ${message}`, error);
    await this.writeLog("error", message, context, error);
  }

  async warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`);
    await this.writeLog("warn", message, context);
  }

  async info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`);
    await this.writeLog("info", message, context);
  }

  async debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`);
    }
    await this.writeLog("debug", message, context);
  }
}

export const logger = new Logger();
