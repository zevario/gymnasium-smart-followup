import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../pool.js';

const createSpv = async () => {
  const { SPV_NAME, SPV_EMAIL, SPV_PASSWORD } = process.env;

  if (!SPV_NAME || !SPV_EMAIL || !SPV_PASSWORD) {
    throw new Error('SPV_NAME, SPV_EMAIL, and SPV_PASSWORD must be configured in .env');
  }

  if (SPV_PASSWORD.length < 8) {
    throw new Error('SPV password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(SPV_PASSWORD, 8);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'spv')
      ON CONFLICT DO NOTHING
      RETURNING id, name, email, role
    `,
    [SPV_NAME, SPV_EMAIL.toLowerCase(), passwordHash],
  );

  if (result.rowCount === 0) {
    console.log('SPV account already exists. No account was created.');
  } else {
    console.log('Initial SPV account created:');
    console.log(result.rows[0]);
  }
};

try {
  await createSpv();
} catch (error) {
  console.error('Failed to create SPV:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
