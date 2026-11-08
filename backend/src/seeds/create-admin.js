import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured in .env',
    );
  }

  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('Admin password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 8);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role,pilot_location)
      VALUES ($1, $2, $3, 'admin','bintaro')
      ON CONFLICT DO NOTHING
      RETURNING id, name, email, role
    `,
    [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), passwordHash],
  );

  if (result.rowCount === 0) {
    console.log('Admin account already exists. No account was created.');
  } else {
    console.log('Initial admin account created:');
    console.log(result.rows[0]);
  }
};

try {
  await createAdmin();
} catch (error) {
  console.error('Failed to create admin:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
