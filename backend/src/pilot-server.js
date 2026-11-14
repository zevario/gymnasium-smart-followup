import app from './pilot-app.js';
import pool from './database/pool.js';
import { startLifecycle } from './modules/pilot/pilot.lifecycle.js';

import { watchFile, unwatchFile, readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import {
  startAccountMailer,
  reloadMailConfiguration,
} from './modules/authentication/account-mail.service.js';

const port = Number(process.env.PILOT_PORT || 3001);
const server = app.listen(port, process.env.PILOT_HOST || '127.0.0.1', () =>
  console.log('Gymnasyum pilot listening on ' + server.address().port),
);
const stopLifecycle = startLifecycle();
const stopAccountMailer = startAccountMailer();
const envFile = new URL('../.env', import.meta.url);
watchFile(envFile, { interval: 1000, persistent: false }, () => {
  try {
    reloadMailConfiguration(dotenv.parse(readFileSync(envFile)));
  } catch {
    console.error('Konfigurasi email belum dapat dimuat ulang.');
  }
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(async () => {
      stopLifecycle();
      unwatchFile(envFile);
      stopAccountMailer();
      await pool.end();
      process.exit(0);
    }),
  );
