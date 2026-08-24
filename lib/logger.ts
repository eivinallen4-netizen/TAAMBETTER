interface LogContext {
  userId?: string;
  email?: string;
  platform?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  [key: string]: any;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  return {
    level,
    message,
    ...context,
  };
}

export const logger = {
  info: (message: string, context?: Partial<LogContext>) => {
    const log = formatLog('info', message, {
      timestamp: new Date().toISOString(),
      ...context,
    });
    console.log(JSON.stringify(log));
  },

  warn: (message: string, context?: Partial<LogContext>) => {
    const log = formatLog('warn', message, {
      timestamp: new Date().toISOString(),
      ...context,
    });
    console.warn(JSON.stringify(log));
  },

  error: (message: string, error?: Error | unknown, context?: Partial<LogContext>) => {
    const log = formatLog('error', message, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
    console.error(JSON.stringify(log));
  },

  debug: (message: string, context?: Partial<LogContext>) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('debug', message, {
        timestamp: new Date().toISOString(),
        ...context,
      });
      console.debug(JSON.stringify(log));
    }
  },
};

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || 'unknown';
}

export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}
