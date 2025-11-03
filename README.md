For the test i decided an modular architecture based on layers, separating responsabilities and facilitating the scalability. Each module has a unique responsibility and can evolve independently.

Folder config (global config)
    in to the config folder you can all configuration from logger service, in this case i decided use Winston because i read beneficts and disventages in differents vlogs and the conclution Winston is more mature, has better compatibility with populars observability platforms, seems to be more widely used, and has a deep and rich ecosystem that will likely continue to grow
    env.js -> The environment variable loader for sensitive or environment-dependent configuration.
    It uses dotenv to securely load credentials and API settings (e.g., TeleTracker credentials) from the .env file.
    If you add services where a previous config is necesary you need add the config service in this folder

Folder database
    stores the local database where the metrics is almacenes about the sended messages

Folder services
    in this folder you will find the logical of business
        messageSender.js : managing sequential SMS and MMS message sending via the Teletracker API.
        summaryModel.js : It handles interaction with the database to record the results of shipments and generate aggregate reports
Folder Utils
    It contains auxiliary functions not specific to the business logic, such as signals.js, which implements the POSIX signal handlers (SIGHUP and SIGINT) to shut down the process in a controlled manner.

server.js

Controls the main application flow: Process command-line arguments(--show-summary).
Initializes dependencies(logger, summaryModel, MessageSender)
Invokes message sending or displays a summary
Coordinates the capture and handling of system signals

If tomorrow you wanted to add a new service that sends emails (EmailSender.js) or another service, for example a task scheduler(TaskScheduler.js) you would simply create a new file in /services and call it from server.js You wouldn't break anything else, because the modules are decoupled by contract (they only depend on simple interfaces like logger and db).

The file.log file is automatically created by the logging service.


How to RUN?
-> npm install
create your .env file
-> node server.js
-> node --show-summary

The demon has 2 different modes, in the normal mode (node server.js)10 text messages will be sent to a number every certain interval of time, after these SMS messages are sent an MMS will be sent.
For the second mode(node --show-summary), a report will be shown with all the messages previously sent.

To modify the test messages, update the this.messages array in MessageSender.js.
To change the destination phone number, set a new value for TELETRACKER_PHONE in your .env file.
Finally, to adjust the delay between each sent message, edit the interval in MessageSender.js as follows:
await new Promise(r => setTimeout(r, 7500));

####
possible improvements
####

Currently, I feel a bit uncomfortable having raw SQL queries defined directly inside the code. In my opinion, exposing SQL statements like this could pose a potential security risk, especially if the codebase becomes public or accessible to others.

For example:
this.db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    success INTEGER,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

this.db.run(
  `INSERT INTO messages (type, success, duration) VALUES (?, ?, ?)`,
  [type, success ? 1 : 0, duration],
  err => (err ? reject(err) : resolve())
);

If this were a larger project and the requirements allowed it, I would prefer to create a dedicated SQL constants module  a separate JavaScript file containing all the queries as exported constants. This approach would help centralize SQL logic, making it easier to maintain and reducing code clutter, without relying on the file system for inline queries.

Another option would be to use an ORM (like Sequelize) or a query builder (such as Knex.js) to abstract the SQL layer and enhance maintainability and security.

Currently, once the messages are sent, if the API fails, those messages are effectively “lost.”
To improve reliability, you could implement a simple retry mechanism to handle temporary network or API errors.

Additionally, to make the application more portable and easier to run across different environments, you could include a Dockerfile. This would allow the entire service to run consistently inside a container, simplifying deployment and setup.