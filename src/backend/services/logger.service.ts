type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

class LoggerService {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, category: string, message: string, meta?: any): string {
    const time = this.getTimestamp();
    const metaStr = meta ? ` | meta: ${JSON.stringify(meta)}` : "";
    return `[${time}] [${level}] [${category}] ${message}${metaStr}`;
  }

  public info(category: string, message: string, meta?: any) {
    console.log(this.formatMessage("INFO", category, message, meta));
  }

  public warn(category: string, message: string, meta?: any) {
    console.warn(this.formatMessage("WARN", category, message, meta));
  }

  public error(category: string, message: string, error?: Error | any, meta?: any) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...meta } 
      : { raw_error: error, ...meta };
    console.error(this.formatMessage("ERROR", category, message, errorDetails));
  }

  public debug(category: string, message: string, meta?: any) {
    if (process.env.NODE_ENV !== "production") {
      console.log(this.formatMessage("DEBUG", category, message, meta));
    }
  }
}

export const logger = new LoggerService();
export default logger;
