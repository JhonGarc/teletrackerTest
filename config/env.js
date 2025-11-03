/**
 * -------------------------------------------------------------
 * ENVIRONMENT CONFIGURATION FOR TELETRACKER
 * -------------------------------------------------------------
 * Loads TeleTracker API credentials and settings from the `.env` file
 * using `dotenv`, keeping sensitive information out of the codebase.
 * -------------------------------------------------------------
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper to enforce required variables
function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

module.exports = {
  TELETRACKER_API_BASE: requireEnv('TELETRACKER_API_BASE'),
  TELETRACKER_USER: requireEnv('TELETRACKER_USER'),
  TELETRACKER_PASS: requireEnv('TELETRACKER_PASS'),
  TELETRACKER_ACCOUNT_ID: requireEnv('TELETRACKER_ACCOUNT_ID'),
  TELETRACKER_PHONE: requireEnv('TELETRACKER_PHONE'),
};
