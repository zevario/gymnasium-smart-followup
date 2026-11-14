import { Router } from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { withTransaction } from '../../database/transaction.js';
import { createRequestLimiter } from '../../middleware/rate-limit.js';
import validate from '../../middleware/validate.js';
import { reject } from '../../utils/http-error.js';
import { hashToken } from './token.service.js';
import { changeOwnPasswordSchema } from '../users/user.schema.js';
import { credentialBinding, mailConfiguration, queueAccountEmail } from './account-mail.service.js';

import { memberPassword, accountEmail } from './authentication.schema.js';
const accountType = Joi.string().valid('customer', 'employee').required();
const token = Joi.string()
  .pattern(/^[a-f0-9]{64}$/)
  .required();
const router = Router();
const mailLimiter = createRequestLimiter({ limit: 12 });
const confirmationLimiter = createRequestLimiter({ limit: 20, skipSuccessfulRequests: true });

async function requestLink(input, purpose) {
  const employee = input.account === 'employee';
  await withTransaction(async (db) => {
    const {
      rows: [account],
    } = await db.query(
      employee
        ? 'SELECT id,email,password_hash FROM users WHERE email=$1 AND is_active FOR UPDATE'
        : 'SELECT person_id,email,password_hash,activation_pending FROM member_accounts WHERE email=$1 FOR UPDATE',
      [input.email],
    );
    if (account && (employee || account.activation_pending === (purpose === 'activate'))) {
      await queueAccountEmail(db, account, input.account, purpose);
    }
  });
}

router.post(
  '/forgot-password',
  mailLimiter,
  validate(Joi.object({ email: accountEmail, account: accountType }).required()),
  async (req, res) => {
    await requestLink(req.validated, 'reset');
    res.status(202).json({ data: true });
  },
);
router.post(
  '/resend-activation',
  mailLimiter,
  validate(Joi.object({ email: accountEmail }).required()),
  async (req, res) => {
    await requestLink({ ...req.validated, account: 'customer' }, 'activate');
    try {
      mailConfiguration();
    } catch (error) {
      if (error.statusCode !== 503) throw error;
      return res.status(202).json({ data: true, delivery: 'waiting-for-sender' });
    }
    res.status(202).json({ data: true });
  },
);

function invalidLink() {
  reject('Tautan sudah kedaluwarsa, sudah digunakan, atau tidak valid.', 410);
}

async function consume(input, reset) {
  const digest = hashToken(input.token);
  const employee = input.account === 'employee';
  await withTransaction(async (db) => {
    const {
      rows: [link],
    } = await db.query(
      'SELECT id,purpose,member_id,employee_id FROM account_email_links WHERE token_hash=$1',
      [digest],
    );
    if (!link || (link.purpose === 'reset') !== reset || Boolean(link.employee_id) !== employee)
      invalidLink();
    const id = link.member_id ?? link.employee_id;
    // All writers acquire the account lock first, then re-check and consume the current link.
    const {
      rows: [account],
    } = await db.query(
      employee
        ? 'SELECT email,password_hash FROM users WHERE id=$1 AND is_active FOR UPDATE'
        : 'SELECT email,password_hash,activation_pending FROM member_accounts WHERE person_id=$1 FOR UPDATE',
      [id],
    );
    if (!account) invalidLink();
    const {
      rows: [used],
    } = await db.query(
      `DELETE FROM account_email_links WHERE id=$1 AND token_hash=$2 AND credential_binding=$3
       AND expires_at>clock_timestamp() RETURNING email`,
      [link.id, digest, credentialBinding(account)],
    );
    if (!used) invalidLink();
    if (reset) {
      if (account.activation_pending || used.email !== account.email) invalidLink();
      if (await bcrypt.compare(input.password, account.password_hash))
        reject('Gunakan kata sandi baru yang berbeda.', 400);
      const hash = await bcrypt.hash(input.password, 12);
      if (employee) {
        await db.query('UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1', [
          id,
          hash,
        ]);
        await db.query(
          'UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',
          [id],
        );
      } else {
        await db.query('UPDATE member_accounts SET password_hash=$2 WHERE person_id=$1', [
          id,
          hash,
        ]);
        await db.query('DELETE FROM member_sessions WHERE person_id=$1', [id]);
      }
    } else if (link.purpose === 'change-email') {
      await db.query('UPDATE member_accounts SET email=$2 WHERE person_id=$1', [id, used.email]);
      await db.query('DELETE FROM member_sessions WHERE person_id=$1', [id]);
    } else {
      if (!account.activation_pending || used.email !== account.email) invalidLink();
      await db.query('UPDATE member_accounts SET activation_pending=false WHERE person_id=$1', [
        id,
      ]);
    }
  });
}

router.post(
  '/activate-email',
  confirmationLimiter,
  validate(Joi.object({ token }).required()),
  async (req, res) => {
    await consume(req.validated, false);
    res.json({ data: true });
  },
);
router.post(
  '/reset-password',
  confirmationLimiter,
  validate(
    Joi.object({
      token,
      account: accountType,
      password: Joi.when('account', {
        is: 'employee',
        then: changeOwnPasswordSchema.extract('newPassword'),
        otherwise: memberPassword,
      }),
    }).required(),
  ),
  async (req, res) => {
    await consume(req.validated, true);
    res.json({ data: true });
  },
);

export default router;
