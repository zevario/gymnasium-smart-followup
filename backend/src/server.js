import 'dotenv/config';

import app from './app.js';
import pool from './config/database.js';
import ReminderSchedulerService from './services/reminders/services/reminder-scheduler-service.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Gymnasyum API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  ReminderSchedulerService.startReminderScheduler();
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down server...`);

  server.close(async () => {
    try {
      ReminderSchedulerService.stopReminderScheduler();
      await pool.end();
      console.log('PostgreSQL pool closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error closing PostgreSQL pool:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
