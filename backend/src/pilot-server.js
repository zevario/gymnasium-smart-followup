import app from './pilot-app.js';
import pool from './database/pool.js';
import { startLifecycle } from './modules/pilot/pilot.lifecycle.js';

import { watchFile, unwatchFile, readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import {
  startAccountMailer,
  reloadMailConfiguration,
  mailConfiguration,
} from './modules/authentication/account-mail.service.js';

// Pengiriman email yang belum dikonfigurasi dulu gagal diam-diam: akun terdaftar,
// email aktivasi tidak pernah sampai. Laporkan statusnya saat start dan tiap .env berubah.
const reportMailConfiguration = () => {
  try {
    mailConfiguration();
    console.log('Pengiriman email aktif melalui ' + process.env.SMTP_HOST);
  } catch {
    console.error(
      'Pengiriman email BELUM aktif: email aktivasi tidak akan terkirim. ' +
        'Lengkapi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM dan APP_PUBLIC_URL di backend/.env.',
    );
  }
};

const port = Number(process.env.PILOT_PORT || 3001);
// Print this line first: test/pilot-http.test.js reads the port from the first output.
const server = app.listen(port, process.env.PILOT_HOST || '127.0.0.1', () => {
  console.log('Gymnasyum pilot listening on ' + server.address().port);
  reportMailConfiguration();
});
const stopLifecycle = startLifecycle();
const stopAccountMailer = startAccountMailer();
const envFile = new URL('../.env', import.meta.url);
watchFile(envFile, { interval: 1000, persistent: false }, () => {
  try {
    reloadMailConfiguration(dotenv.parse(readFileSync(envFile)));
    reportMailConfiguration();
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
