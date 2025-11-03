/**
 * -------------------------------------------------------------
 * SETUP SIGNAL HANDLERS 
 * -------------------------------------------------------------
 * This module defines the `setupSignalHandlers` function, which
 * listens for POSIX process signals (SIGHUP and SIGINT) and
 * performs graceful shutdown actions when those signals are received.
 *
 * It is commonly used in server applications, daemons, and background
 * services to ensure that all resources (e.g., database connections,
 * file streams, or network sockets) are properly cleaned up before
 * the Node.js process exits.
 *

 * The function takes two parameters:
 *   - `logger`: an injected logging service,
 *               used to record signal-related events.
 *   - `cleanupCallback`: an optional asynchronous function that
 *                        performs cleanup tasks (e.g., closing DB
 *                        connections, flushing logs, etc.).
 *
 * Injecting these dependencies keeps the function reusable and
 * environment-agnostic — it doesn’t depend on specific global
 * implementations or frameworks.
 *
 * -------------------------------------------------------------
 * SIGNALS HANDLED
 * -------------------------------------------------------------
 * - **SIGHUP**: Sent when a terminal disconnects or the controlling
 *               process requests a reload. Here, it only logs a warning.
 *
 * - **SIGINT**: Sent when the user presses `Ctrl + C` or when the
 *               process receives a termination signal.
 *               The handler logs the shutdown process, calls the
 *               cleanup callback if available, and exits gracefully
 *               with custom exit code `999`.
 *
 * -------------------------------------------------------------
 */

function setupSignalHandlers(logger, cleanupCallback) {
  /**
   * Handle SIGHUP signal (terminal hangup or manual reload trigger).
   * - Logs a warning indicating the event was received.
   * - No shutdown occurs; primarily informational.
   */
  process.on('SIGHUP', () => {
    logger.warn('SIGHUP signal received!');
  });

  /**
   * Handle SIGINT signal (interrupt request, typically Ctrl+C).
   * - Logs the shutdown initiation.
   * - Executes any provided cleanup callback asynchronously.
   * - Logs completion message and exits with code 999.
   */
  process.on('SIGINT', async () => {
    logger.warn('SIGINT signal detected. Beginning graceful shutdown...');
    
    // Execute cleanup logic if provided
    if (cleanupCallback) await cleanupCallback();

    logger.info('Cleanup completed. Exiting process with code 999.');
    process.exit(999);
  });
}

// Export the setup function for external use.
module.exports = { setupSignalHandlers };
