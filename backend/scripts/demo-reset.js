import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/**
 * Menyiapkan ulang database demo dari nol dalam satu perintah:
 * hapus dan buat ulang database, migrasi, lalu seed admin, supervisor, dan data demo AI.
 *
 * Pengaman: hanya berjalan bila nama database (PGDATABASE) mengandung "demo", agar
 * database kerja atau data asli tidak pernah terhapus oleh perintah ini.
 *   PGDATABASE=gymnasyum_demo npm run demo:reset
 */
const database = process.env.PGDATABASE || '';
if (!/demo/i.test(database) || !/^[a-z0-9_]+$/i.test(database)) {
  console.error(
    `Ditolak: PGDATABASE="${database}". demo:reset menghapus seluruh database, jadi hanya ` +
      'dijalankan untuk database bernama *demo* (huruf, angka, garis bawah), mis. gymnasyum_demo.',
  );
  process.exit(1);
}
if (process.env.DATABASE_URL) {
  console.error('Ditolak: DATABASE_URL terisi dan bisa membuat migrasi menyasar database lain.');
  process.exit(1);
}

const backend = fileURLToPath(new URL('..', import.meta.url));
const run = (label, args) => {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(process.execPath, args, { cwd: backend, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Gagal di langkah: ${label}`);
    process.exit(result.status || 1);
  }
};

const admin = new pg.Client({ database: 'postgres' });
await admin.connect();
try {
  console.log(`▶ Membuat ulang database ${database}`);
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${database}"`);
} finally {
  await admin.end();
}

run('Migrasi', ['node_modules/node-pg-migrate/bin/node-pg-migrate.js', 'up']);
run('Akun admin', ['src/database/seeds/create-admin.js']);
run('Akun supervisor', ['src/database/seeds/create-spv.js']);
run('Data demo AI', ['src/database/seeds/seed-ai-demo.js']);
console.log(
  `\nDatabase ${database} siap. Nyalakan layanan AI (port 8000) lalu backend (npm run pilot).`,
);
