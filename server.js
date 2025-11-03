/**
 * -------------------------------------------------------------
 * MAIN APPLICATION ENTRY POINT 
 * -------------------------------------------------------------
 * This script serves as the main entry point for the message
 * sending simulator. It orchestrates the initialization of the
 * logger, database model, signal handlers, and message sender.
 *
 * The application can:
 *   1. Send a predefined batch of SMS and MMS messages.
 *   2. Display a summary of previously sent messages stored in SQLite.
 *
 * -------------------------------------------------------------
 * DEPENDENCY INJECTION
 * -------------------------------------------------------------
 * The main components are created using dependency injection:
 *   - `logger`: provides structured logging throughout the app.
 *   - `dbModel`: instance of `SummaryModel`, handles SQLite storage.
 *   - `MessageSender`: uses the above dependencies to send and record messages.
 *
 * This design promotes modularity, easier testing, and clean separation
 * between infrastructure (logging, DB) and business logic (message sending).
 *
 * -------------------------------------------------------------
 * SIGNAL MANAGEMENT
 * -------------------------------------------------------------
 * The script installs POSIX signal handlers (SIGHUP, SIGINT)
 * through `setupSignalHandlers()` to enable graceful shutdowns
 * and controlled process termination.
 *
 * -------------------------------------------------------------
 * COMMAND LINE USAGE
 * -------------------------------------------------------------
 * The script supports a command-line argument:
 *
 *   node index.js --show-summary
 *     → Displays message statistics from the SQLite database.
 *
 *   node index.js
 *     → Sends all predefined messages via the TeleTracker API.
 *
 * -------------------------------------------------------------
 * FILE STRUCTURE OVERVIEW
 * -------------------------------------------------------------
 *  ./config/logger.js        → Winston-based logger configuration
 *  ./utils/signals.js        → POSIX signal setup utility
 *  ./services/MessageSender  → Handles SMS/MMS sending logic
 *  ./services/SummaryModel   → Database operations and summary generation
 */

const logger = require('./config/logger');
const { setupSignalHandlers } = require('./utils/signals');
const MessageSender = require('./services/MessageSender');
const SummaryModel = require('./services/SummaryModel');

// -------------------------------------------------------------
// Initialize database model and signal handlers
// -------------------------------------------------------------

/**
 * Create a new database model instance, injecting the logger.
 * This model manages message logs and summaries.
 */
const dbModel = new SummaryModel(logger);

/**
 * Setup signal listeners for graceful shutdown.
 * When a termination signal (e.g., Ctrl+C) is received,
 * a cleanup message is logged before exiting.
 */
setupSignalHandlers(logger, async () => logger.info('Closing resources...'));

// Retrieve command-line argument ("--show-summary").
const arg = process.argv[2];

// -------------------------------------------------------------
// MAIN EXECUTION CONTEXT (ASYNC IIFE)
// -------------------------------------------------------------

/**
 * The main asynchronous block determines whether the script
 * should display a summary or start sending messages.
 */
(async () => {
  if (arg === '--show-summary') {
    // --- DISPLAY STORED MESSAGE STATISTICS ---
    const summary = await dbModel.getSummary();
    logger.info('--- Message Summary ---');
    logger.info(`Total sent: ${summary.total}`);
    logger.info(`SMS: ${summary.sms}, MMS: ${summary.mms}`);
    logger.info(`Average duration: ${summary.avgDuration} ms`);
    logger.info(`Success rate: ${summary.successRate}%`);
    process.exit(0); // Graceful exit after displaying summary
  } else {
    // --- SEND ALL TEST MESSAGES (SMS + MMS) ---
    const sender = new MessageSender(logger, dbModel);
    await sender.sendAll();
  }
})();
