export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Sink that actually emits a log record. Replaceable so tests can capture output. */
export type LogWriter = (
  level: LogLevel,
  scope: string,
  message: string,
  ...args: unknown[]
) => void;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// This module is the single place in the codebase allowed to touch the console.
function consoleWriter(
  level: LogLevel,
  scope: string,
  message: string,
  ...args: unknown[]
): void {
  const prefix = `[${scope}]`;
  /* eslint-disable no-console */
  switch (level) {
    case 'debug':
      console.debug(prefix, message, ...args);
      break;
    case 'info':
      console.info(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
  /* eslint-enable no-console */
}

let writer: LogWriter = consoleWriter;
let threshold: LogLevel = 'info';

/** Replace the log sink (used by tests to capture records). */
export function setLogWriter(next: LogWriter): void {
  writer = next;
}

/** Suppress records below this level. */
export function setLogLevel(level: LogLevel): void {
  threshold = level;
}

export type Logger = (
  level: LogLevel,
  message: string,
  ...args: unknown[]
) => void;

/** Create a logger bound to a scope name, e.g. createLogger("HostSession"). */
export function createLogger(scope: string): Logger {
  return (level, message, ...args) => {
    if (levelOrder[level] < levelOrder[threshold]) {
      return;
    }
    writer(level, scope, message, ...args);
  };
}
