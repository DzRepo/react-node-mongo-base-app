import winston from 'winston';
import { format } from 'winston';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE = process.env.LOG_FILE || 'logs/app.log';
const CLOUD_LOGGING = process.env.CLOUD_LOGGING === 'true';

// Custom format for local logging
const localFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: localFormat,
  transports: [
    // Always log to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        localFormat
      ),
    }),
    // Local file logging
    new winston.transports.File({
      filename: path.join(process.cwd(), LOG_FILE),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add cloud logging transport if enabled
if (CLOUD_LOGGING) {
  // This is a placeholder for cloud logging implementation
  // You would add the specific cloud provider's transport here
  // Example: new CloudLoggingTransport({ ... })
}

export default logger; 