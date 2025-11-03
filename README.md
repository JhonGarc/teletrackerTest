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
