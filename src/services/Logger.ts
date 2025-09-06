import type { LogLevel } from "../types/app";

// Create a wrapper logger for web environment
const logger = {
  debug: (message: string, ...args: any[]) => {
    console.debug(`[MAIN] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`[MAIN] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[MAIN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[MAIN] ${message}`, ...args);
  },
  setLevel: (level: LogLevel) => {
    // In web environment, we can't dynamically control console log levels
    // This is a no-op but maintains API compatibility
    const levelNames = {
      [0]: "DEBUG",
      [1]: "INFO",
      [2]: "WARN",
      [3]: "ERROR",
      [4]: "NONE",
    };
    console.info(`[MAIN] Log level set to ${levelNames[level]}`);
  },
};

export { logger };
