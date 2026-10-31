import winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured server-side logging with level indicators and timestamps.
 * Sanitizes output to ensure no passwords, secrets, or tokens are logged.
 */

// Custom sanitizer format to prevent logging sensitive data
const sanitizeSensitiveData = winston.format((info) => {
  const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'authorization', 'cookie'];

  const sanitizeObj = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObj);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObj(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  info.message = typeof info.message === 'object' ? sanitizeObj(info.message) : info.message;
  return info;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    sanitizeSensitiveData(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bookstore-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] [${service}] ${level}: ${typeof message === 'object' ? JSON.stringify(message) : message} ${metaString}`;
        })
      ),
    }),
  ],
});

export default logger;
