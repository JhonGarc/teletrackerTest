/**
 * -------------------------------------------------------------
 * MESSAGE SENDER CLASS 
 * -------------------------------------------------------------
 * This module defines the `MessageSender` class, which simulates
 * sending SMS and MMS messages using the TeleTracker API
 * (in "Integrator" mode).
 *
 *  - Dependency Injection: injecting `logger` and `dbModel` for logging and persistence.
 *  - Asynchronous HTTP requests using Axios.
 *  - Basic control flow for sequential message sending.
 *  - Handling of POSIX signals (SIGHUP and SIGINT) for graceful shutdown testing.
 *  - MMS message creation using an image fetched from an external API.
 *
 * -------------------------------------------------------------
 * DEPENDENCY INJECTION
 * -------------------------------------------------------------
 * The constructor receives:
 *   - `logger`: an external logging service for recording events.
 *   - `dbModel`: a database model object used to store message metadata (type, success, duration).
 *
 * This approach improves modularity and testability, since the class does not
 * directly depend on specific logging or database implementations.
 *
 * -------------------------------------------------------------
 * WHY USE `picsum.photos`?
 * -------------------------------------------------------------
 * The service https://picsum.photos/ provides free random images.
 * Here, it is used to simulate image attachments in MMS messages
 * without needing to host or generate images locally.
 *
 * The image is fetched as a binary buffer (`arraybuffer`) and then
 * attached to the MMS request as a form-data field.
 *
 * -------------------------------------------------------------
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const {
  TELETRACKER_API_BASE,
  TELETRACKER_USER,
  TELETRACKER_PASS,
  TELETRACKER_ACCOUNT_ID,
  TELETRACKER_PHONE,
} = require('../config/env');

class MessageSender {
  /**
   * Constructor for MessageSender.
   * - Injects external dependencies (`logger`, `dbModel`).
   * - Initializes configuration parameters and message queue.
   */
  constructor(logger, dbModel) {
    this.logger = logger;
    this.db = dbModel;

    // Predefined set of messages for testing sequential SMS sending.
    this.messages = [
      "Hello there, this is test message number one!",
      "How much does a cloud weigh on a sunny day?",
      "If cats could text, what would they even say?",
      "Message number four reporting for duty!",
      "Ever wondered where lost socks go?",
      "Beep boop... just another test message!",
      "How many tacos is too many tacos?",
      "This message is sponsored by curiosity.",
      "Testing, testing... is anyone out there?",
      "Message number ten — the grand finale!"
    ];

    // TeleTracker API credentials and configuration (Integrator mode).
    this.apiBase = TELETRACKER_API_BASE;
    this.integratorUser = TELETRACKER_USER;
    this.integratorPass = TELETRACKER_PASS;
    this.accountId = TELETRACKER_ACCOUNT_ID;
    this.phoneNumber = TELETRACKER_PHONE;
  }

  /**
   * Private helper method to create the Authorization header
   * required by the TeleTracker API.
   *
   * Combines the Integrator user and password, encodes them in Base64,
   * and returns an HTTP header object.
   */
  _getAuthHeader() {
    const token = Buffer.from(`${this.integratorUser}:${this.integratorPass}`).toString('base64');
    return { Authorization: `Integrator ${token}` };
  }

  /**
   * Main execution method that sends all SMS messages and a final MMS.
   * Steps:
   *  1. Sends a SIGHUP signal to simulate process notification.
   *  2. Iterates through messages in reverse order and sends them sequentially.
   *  3. Waits 7.5 seconds between each SMS to avoid rate limits.
   *  4. Sends one final MMS message.
   *  5. Sends a SIGINT signal to simulate graceful shutdown.
   *
   * Any errors during sending are logged and cause process termination.
   */
  async sendAll() {
    try {
      this.logger.info('test POSIX SIGHUP SIGNAL');
      process.kill(process.pid, 'SIGHUP');

      this.logger.info('Starting SMS message sequence...');
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const msg = this.messages[i];
        await this.sendSMS(msg);
        await new Promise(r => setTimeout(r, 7500)); // 7.5s delay between messages
      }

      this.logger.info('Sending final MMS message...');
      await this.sendMMS();
      this.logger.info('All messages sent successfully.');

      this.logger.info('Sending SIGINT signal to process');
      process.kill(process.pid, 'SIGINT');
    } catch (err) {
      this.logger.error(`Error while sending messages: ${err.message}`);
      process.exit(1);
    }
  }

  /**
   * Sends a single SMS message via the TeleTracker API.
   * - Sends a POST request with the SMS payload.
   * - Measures request duration and logs success/failure.
   * - Stores message metadata in the database through `db.saveMessage()`.
   */
  async sendSMS(text) {
    const start = Date.now();
    try {
      const response = await axios.post(
        `${this.apiBase}/sms/send`,
        {
          account_id: this.accountId,
          to_number: this.phoneNumber,
          payload: text
        },
        {
          headers: {
            ...this._getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = Date.now() - start;
      const success = response.data?.success === true;
      await this.db.saveMessage('SMS', success, duration);
      this.logger.info(`SMS sent: "${text}" (${duration} ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      await this.db.saveMessage('SMS', false, duration);
      this.logger.error(`Failed to send SMS: ${err.message}`);

      // If the error includes an HTTP response, print detailed debugging info
      if (err.response) {
        console.error('status:', err.response.status);
        console.error('headers:', err.response.headers);
        console.error('data:', err.response.data);
      } else {
        console.error(err);
      }
    }
  }

  /**
   * Sends a single MMS message with an image attachment.
   * - Fetches a random image from https://picsum.photos.
   * - Uses `form-data` to build a multipart/form-data request.
   * - Sends the request to the TeleTracker MMS API.
   * - Logs result and saves metadata to the database.
   */
  async sendMMS() {
    const start = Date.now();

    try {
      // Step 1: Fetch a random image as binary data (Buffer)
      const imageResponse = await axios.get('https://picsum.photos/300', {
        responseType: 'arraybuffer'
      });

      // Step 2: Build form-data payload
      const FormData = require('form-data');
      const formData = new FormData();

      formData.append('account_id', this.accountId);
      formData.append('to_number', this.phoneNumber);
      formData.append('payload', 'This is a test MMS message');
      formData.append('image1', Buffer.from(imageResponse.data), {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      // Step 3: Send MMS request
      const response = await axios.post(
        `${this.apiBase}/mms/send`,
        formData,
        {
          headers: {
            ...this._getAuthHeader(),
            ...formData.getHeaders()
          }
        }
      );

      // Step 4: Log and record results
      const duration = Date.now() - start;
      const success = response.data?.success === true;
      await this.db.saveMessage('MMS', success, duration);
      this.logger.info(`MMS sent (${duration} ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      await this.db.saveMessage('MMS', false, duration);
      this.logger.error(`Failed to send MMS: ${err.message}`);
    }
  }
}

// Export the MessageSender class for use in other modules.
module.exports = MessageSender;
