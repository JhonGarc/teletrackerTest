/**
 * -------------------------------------------------------------
 * SUMMARY MODEL 
 * -------------------------------------------------------------
 * This module defines the `SummaryModel` class, responsible for
 * persisting and summarizing message delivery data (SMS and MMS)
 * using a local SQLite3 database.
 *
 * It serves as a lightweight persistence layer for tracking:
 *  - The total number of messages sent.
 *  - Their types (SMS or MMS).
 *  - Success/failure status.
 *  - Delivery duration (milliseconds).
 *  - Timestamps for each record.
 *

 * The class receives a `logger` object in its constructor.
 * This dependency is injected externally 
 * to allow consistent and centralized logging across the system.
 *
 * This design keeps the model independent of any specific
 * logging implementation, improving modularity and testability.
 *
 * -------------------------------------------------------------
 * DATABASE DETAILS
 * -------------------------------------------------------------
 * - SQLite3 is used as an embedded local database (no external server needed).
 * - The database file is stored in: `../database/messages.db`
 * - The table `messages` contains the following columns:
 *     id          INTEGER (Primary Key, Auto-Increment)
 *     type        TEXT ("SMS" or "MMS")
 *     success     INTEGER (1 = success, 0 = failure)
 *     duration    INTEGER (time in milliseconds)
 *     created_at  TIMESTAMP (auto-filled with current time)
 *
 * -------------------------------------------------------------
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SummaryModel {
  /**
   * Constructor for the SummaryModel class.
   * - Accepts an injected logger dependency.
   * - Initializes a SQLite3 database connection.
   * - Creates the `messages` table if it doesn't already exist.
   */
  constructor(logger) {
    this.logger = logger;

    // Define database file path relative to this script.
    const dbPath = path.join(__dirname, '../database/messages.db');

    // Open (or create) the SQLite database file.
    this.db = new sqlite3.Database(dbPath);

    // Create the table if it doesn’t exist already.
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        success INTEGER,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.logger.info('SQLite database initialized and table verified.');
  }

  /**
   * Saves a message record to the `messages` table.
   * - Accepts message type (SMS/MMS), success status, and duration.
   * - Uses parameterized queries to prevent SQL injection.
   * - Returns a Promise that resolves when insertion is complete.
   *
   */
  saveMessage(type, success, duration) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (type, success, duration) VALUES (?, ?, ?)`,
        [type, success ? 1 : 0, duration],
        err => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Retrieves a statistical summary of all messages stored in the database.
   * - Fetches all rows from the `messages` table.
   * - Calculates:
   *     total number of messages,
   *     count of SMS and MMS messages,
   *     average sending duration,
   *     success rate (percentage of successful sends).
   * - Returns an object containing the summarized data.
   */
  getSummary() {
    return new Promise((resolve, reject) => {
      const summary = {};
      this.db.all(`SELECT * FROM messages`, (err, rows) => {
        if (err) return reject(err);

        const total = rows.length;
        const sms = rows.filter(r => r.type === 'SMS').length;
        const mms = rows.filter(r => r.type === 'MMS').length;
        const avg = rows.reduce((a, b) => a + b.duration, 0) / (total || 1);
        const successRate =
          (rows.filter(r => r.success === 1).length / (total || 1)) * 100;

        summary.total = total;
        summary.sms = sms;
        summary.mms = mms;
        summary.avgDuration = avg.toFixed(2);
        summary.successRate = successRate.toFixed(2);

        resolve(summary);
      });
    });
  }
}

// Export the SummaryModel class for use in other parts of the system.
module.exports = SummaryModel;
