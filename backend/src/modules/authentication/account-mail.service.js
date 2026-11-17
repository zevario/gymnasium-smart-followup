import { accountEmailTemplate, changeEmailNoticeText } from './account-email.template.js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'node:crypto';
import { hashToken } from './token.service.js';
import { withTransaction } from '../../database/transaction.js';
import { reject } from '../../utils/http-error.js';

let mailer;

export function reloadMailConfiguration(settings) {
  for (const key of [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'MAIL_FROM',
    'APP_PUBLIC_URL',
  ]) {
    if (Object.hasOwn(settings, key)) process.env[key] = settings[key];
  }
  mailer = undefined;
}

export function mailConfiguration() {
  if (mailer) return mailer;
  const {
    SMTP_HOST,
    SMTP_PORT = '587',
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
    APP_PUBLIC_URL,
  } = process.env;
  const port = Number(SMTP_PORT);
  let origin;
  try {
    origin = new URL(APP_PUBLIC_URL);
  } catch {
    /* reported below */
  }
  if (
    !SMTP_HOST ||
    !MAIL_FROM ||
    !origin ||
    !['http:', 'https:'].includes(origin.protocol) ||
    (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    Boolean(SMTP_USER) !== Boolean(SMTP_PASS)
  ) {
    reject('Pengiriman email belum dikonfigurasi.', 503);
  }
  const local = ['127.0.0.1', 'localhost', '::1'].includes(SMTP_HOST);
  mailer = {
    origin: origin.origin,
    from: MAIL_FROM,
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: !local || process.env.NODE_ENV === 'production',
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    }),
  };
  return mailer;
}

export function credentialBinding(account) {
  return hashToken(account.email + '\n' + account.password_hash);
}

// Call with the account locked. Repeated requests coalesce into one pending delivery.
export async function queueAccountEmail(db, account, kind, purpose, email = account.email) {
  const owner = kind === 'customer' ? 'member_id' : 'employee_id';
  await db.query(
    `INSERT INTO account_email_links (${owner},purpose,email,credential_binding)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (${owner},purpose) DO UPDATE SET email=EXCLUDED.email,
       credential_binding=EXCLUDED.credential_binding, requested_at=now(), next_attempt_at=now(),
       attempts=0, token_hash=NULL, expires_at=NULL
     WHERE account_email_links.requested_at < now()-interval '1 minute'
       OR account_email_links.email <> EXCLUDED.email
       OR account_email_links.credential_binding <> EXCLUDED.credential_binding`,
    [account.person_id ?? account.id, purpose, email, credentialBinding(account)],
  );
}

async function deliverOne() {
  return withTransaction(async (db) => {
    const {
      rows: [job],
    } = await db.query(
      `SELECT * FROM account_email_links WHERE next_attempt_at<=now()
       AND requested_at > now()-interval '24 hours'
       ORDER BY next_attempt_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`,
    );
    if (!job) return false;
    const token = randomBytes(32).toString('hex');
    const isReset = job.purpose === 'reset';
    const lifetime = isReset ? '30 minutes' : '24 hours';
    const kind = job.member_id ? 'customer' : 'employee';
    let origin, from, transport;
    try {
      ({ origin, from, transport } = mailConfiguration());
    } catch (error) {
      // Tanpa SMTP, email tidak pernah terkirim dan akun tersangkut tanpa jejak.
      // Saat development, catat tautannya ke log agar alur aktivasi tetap bisa
      // diselesaikan. Jalur ini berhenti sendiri begitu SMTP dikonfigurasi.
      if (process.env.NODE_ENV !== 'development') throw error;
      const fallback = new URL(
        isReset ? '/reset-password' : '/activate-email',
        process.env.APP_PUBLIC_URL,
      );
      fallback.searchParams.set('account', kind);
      fallback.hash = token;
      console.warn(
        '[DEV] SMTP belum dikonfigurasi. Tautan ' +
          job.purpose +
          ' untuk ' +
          job.email +
          ': ' +
          fallback.href,
      );
      await db.query(
        'UPDATE account_email_links SET token_hash=$2, expires_at=clock_timestamp()+$3::interval, next_attempt_at=NULL WHERE id=$1',
        [job.id, hashToken(token), lifetime],
      );
      return true;
    }
    try {
      const url = new URL(isReset ? '/reset-password' : '/activate-email', origin);
      url.searchParams.set('account', kind);
      // The secret fragment is sent only in the subsequent POST, never in server access logs.
      url.hash = token;
      const title = isReset
        ? 'Reset password'
        : job.purpose === 'change-email'
          ? 'Konfirmasi email baru'
          : 'Aktivasi akun';
      const {
        rows: [person],
      } = await db.query(
        job.member_id
          ? 'SELECT name FROM pilot_people WHERE id=$1'
          : 'SELECT name FROM users WHERE id=$1',
        [job.member_id ?? job.employee_id],
      );
      if (job.purpose === 'change-email') {
        const {
          rows: [account],
        } = await db.query('SELECT email FROM member_accounts WHERE person_id=$1', [job.member_id]);
        // Warn the current address so a hijacked session cannot move the account silently.
        // shortcut: a failed confirmation send retries the whole job, so the notice may repeat.
        if (account && account.email !== job.email)
          await transport.sendMail({
            from,
            to: { address: account.email, name: person?.name || '' },
            subject: 'Permintaan ganti email Gymnasyum',
            text: changeEmailNoticeText({ name: person?.name, newEmail: job.email }),
          });
      }
      await transport.sendMail({
        from,
        to: { address: job.email, name: person?.name || '' },
        subject: title + ' Gymnasyum',
        ...accountEmailTemplate({ name: person?.name, purpose: job.purpose, url: url.href }),
      });
    } catch (error) {
      console.error('Account email delivery failed', error.code || error.name, error.message || '');
      await db.query(
        `UPDATE account_email_links SET attempts=attempts+1,
         next_attempt_at=now()+least(3600, 30*power(2,least(attempts,7))) * interval '1 second' WHERE id=$1`,
        [job.id],
      );
      return false;
    }
    await db.query(
      'UPDATE account_email_links SET token_hash=$2, expires_at=clock_timestamp()+$3::interval, next_attempt_at=NULL WHERE id=$1',
      [job.id, hashToken(token), lifetime],
    );
    return true;
  });
}

export function startAccountMailer() {
  let running = false;
  let stopped = false;
  const run = async () => {
    if (running || stopped) return;
    running = true;
    try {
      while (!stopped && (await deliverOne())) {
        /* drain ready messages */
      }
    } catch (error) {
      console.error('Account email worker failed', error.code || error.name);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, 1000);
  run();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
