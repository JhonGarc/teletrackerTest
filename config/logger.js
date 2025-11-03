/**
 * --------------------------------------------
 * LOGGER CONFIGURATION USING WINSTON
 * --------------------------------------------
 * This module sets up a custom logger using the Winston library.
 * It provides formatted, timestamped, and colorized log messages
 * that are written both to the console and to a log file (`server.log`).
 *
 * Winston is a flexible logging library often used in Node.js
 * to record informational messages, warnings, and errors
 * for debugging and system monitoring purposes.
 *
 */
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;


/**
 * Custom log message format function.
 * - The printf() method allows defining a custom format for log messages.
 * - It receives a log object and returns a formatted string.
 * - Here, we structure each log as: [timestamp] level: message
 */
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});


/**
 * Create and configure the Winston logger instance.
 * - 'level': defines the minimum severity level that will be logged.
 *   (e.g., 'info' logs info, warning, and error messages).
 * - 'format': defines how log messages are displayed (colorized, with timestamps, etc.).
 * - 'transports': defines where the logs are sent (console, file, etc.).
 */
const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(), // Adds color to log levels (only visible in console output).
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Adds a readable timestamp to each log entry.
    logFormat // Applies the custom message formatting defined above.
  ),
  transports: [
    new transports.Console(), // Logs appear in the console .
    new transports.File({ filename: 'server.log' }) // Logs are also saved to a file named 'server.log'.
  ]
});

module.exports = logger;
