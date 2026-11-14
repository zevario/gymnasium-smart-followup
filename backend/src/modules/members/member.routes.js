import { Router } from 'express';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import pool from '../../database/pool.js';
import { withTransaction } from '../../database/transaction.js';
import { reject } from '../../utils/http-error.js';
import { loginLimiter, createRequestLimiter } from '../../middleware/rate-limit.js';
import { importRecord } from '../pilot/pilot.repository.js';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import { pilotScope } from '../pilot/pilot.scope.js';

import {
  accountEmail as email,
  memberPassword as password,
} from '../authentication/authentication.schema.js';
import { queueAccountEmail } from '../authentication/account-mail.service.js';

const router = Router();
const registrationLimiter = createRequestLimiter({ limit: 10 });
const profile = {
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{7,14}$/)
    .required(),
  contact: Joi.boolean().strict().required(),
};
const digest = (value) => createHash('sha256').update(value).digest('hex');
const tokenOf = (req) => (req.headers.authorization || '').replace(/^Bearer /, '');
const result = (res, data) => res.json({ data });
const personalDetails = {
  birth: Joi.date().iso().max('now').allow(''),
  gender: Joi.string().valid('', 'Laki-laki', 'Perempuan', 'Lainnya'),
  country: Joi.string().max(80).allow(''),
  address: Joi.string().max(300).allow(''),
};
const validateId = (req, _res, next, id) => {
  const { error } = Joi.string().uuid().validate(id);
  if (error) reject('ID permintaan tidak valid.', 400);
  next();
};
router.param('id', validateId);

router.post('/register', registrationLimiter, async (req, res) => {
  const data = await Joi.object({ email, password, ...profile }).validateAsync(req.body);
  const hash = await bcrypt.hash(data.password, 12);
  await withTransaction(async (db) => {
    const {
      rows: [person],
    } = await db.query(
      "INSERT INTO pilot_people(location,source_id,name,phone,consent,complaint,observed_at) VALUES('bintaro',$1,$2,$3,$4,false,now()) RETURNING id",
      ['portal-' + randomUUID(), data.name, data.phone, data.contact ? 'granted' : 'withdrawn'],
    );
    const {
      rows: [account],
    } = await db.query(
      'INSERT INTO member_accounts(person_id,email,password_hash) VALUES($1,$2,$3) RETURNING person_id,email,password_hash',
      [person.id, data.email, hash],
    );
    await queueAccountEmail(db, account, 'customer', 'activate');
  });
  result(res, true);
});
router.post('/login', loginLimiter, async (req, res) => {
  const data = await Joi.object({ email, password }).validateAsync(req.body);
  const {
    rows: [user],
  } = await pool.query('SELECT * FROM member_accounts WHERE email=$1', [data.email]);
  if (!user || !(await bcrypt.compare(data.password, user.password_hash)))
    reject('Email atau kata sandi salah.', 401);
  if (user.activation_pending)
    return res
      .status(403)
      .json({ code: 'EMAIL_ACTIVATION_REQUIRED', message: 'Aktifkan email Anda sebelum masuk.' });
  const token = randomBytes(32).toString('hex');
  await withTransaction(async (db) => {
    const current = await db.query(
      'SELECT 1 FROM member_accounts WHERE person_id=$1 AND email=$2 AND password_hash=$3 AND NOT activation_pending FOR UPDATE',
      [user.person_id, data.email, user.password_hash],
    );
    if (!current.rowCount) reject('Silakan masuk kembali.', 401);
    await db.query("INSERT INTO member_sessions VALUES($1,$2,now()+interval '8 hours')", [
      digest(token),
      user.person_id,
    ]);
  });
  result(res, { token });
});

export const staffRequests = Router();
staffRequests.param('id', validateId);
staffRequests.use(authentication, pilotScope, authorization('staff', 'spv'));
staffRequests.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT r.*,p.name FROM member_requests r JOIN pilot_people p ON p.id=r.person_id WHERE p.location='bintaro' ORDER BY (state='pending') DESC,created_at DESC",
  );
  result(res, rows);
});
staffRequests.post('/:id/paid', async (req, res) => {
  const updated = await pool.query(
    "UPDATE member_requests r SET paid_at=now(),actor=$2 FROM pilot_people p WHERE r.id=$1 AND r.person_id=p.id AND p.location='bintaro' AND r.state='confirmed' AND r.amount>0 AND r.paid_at IS NULL",
    [req.params.id, req.user.id],
  );
  if (!updated.rowCount) reject('Tagihan tidak tersedia.');
  result(res, true);
});
staffRequests.post('/:id', async (req, res) => {
  const input = await Joi.object({
    amount: Joi.number().integer().min(0).max(2000000000),
    state: Joi.string().valid('confirmed', 'declined').required(),
    response: Joi.string().trim().min(2).max(500).required(),
    package: Joi.string().trim().max(100),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  }).validateAsync(req.body);
  await withTransaction(async (db) => {
    const {
      rows: [r],
    } = await db.query(
      "SELECT r.*,p.source_id,p.name,p.phone,p.consent,p.complaint,p.opted_out_at FROM member_requests r JOIN pilot_people p ON p.id=r.person_id WHERE r.id=$1 AND p.location='bintaro' FOR UPDATE OF r,p",
      [req.params.id],
    );
    if (!r || r.state !== 'pending') reject('Permintaan tidak tersedia.');
    if (input.state === 'confirmed' && ['trial', 'package', 'renewal'].includes(r.kind)) {
      if (!input.date || !input.package)
        reject('Nama paket atau trial dan tanggal wajib diisi.', 400);
      const anchor = input.date + 'T00:00:00+07:00';
      const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
      if (
        !Number.isFinite(Date.parse(anchor)) ||
        new Date(input.date + 'T12:00:00Z').toISOString().slice(0, 10) !== input.date ||
        (r.kind === 'trial' ? input.date > today : input.date < today)
      )
        reject('Periksa tanggal trial selesai atau masa akhir paket.', 400);
      await importRecord(
        db,
        {
          location: 'bintaro',
          customerId: r.source_id,
          name: r.name,
          phone: r.phone,
          consent: r.consent,
          complaint: r.complaint,
          observedAt: new Date(Date.now()).toISOString(),
          cycleId: r.id,
          goal: r.kind === 'trial' ? 'trial' : 'renewal',
          package: input.package,
          anchor,
          interest: 'none',
          visits: 0,
          transaction: null,
          ...(r.kind === 'trial' ? {} : { membershipState: 'renewable' }),
        },
        req.user.id,
      );
    }
    await db.query(
      'UPDATE member_requests SET state=$2,response=$3,resolved_at=now(),actor=$4,amount=$5 WHERE id=$1',
      [
        r.id,
        input.state,
        input.response,
        req.user.id,
        input.state === 'confirmed' ? input.amount : null,
      ],
    );
  });
  result(res, true);
});
router.use(async (req, _res, next) => {
  const {
    rows: [session],
  } = await pool.query(
    'SELECT person_id FROM member_sessions WHERE token_hash=$1 AND expires_at>now()',
    [digest(tokenOf(req))],
  );
  if (!session) reject('Silakan masuk kembali.', 401);
  req.memberId = session.person_id;
  next();
});
router.post('/logout', async (req, res) => {
  await pool.query('DELETE FROM member_sessions WHERE token_hash=$1', [digest(tokenOf(req))]);
  result(res, true);
});
router.get('/me', async (req, res) => {
  const id = [req.memberId];
  const {
    rows: [person],
  } = await pool.query(
    "SELECT p.id,p.name,p.phone,a.email,a.settings,a.joined_at,a.acknowledged_at,(p.consent='granted' AND p.opted_out_at IS NULL) AS contact FROM member_accounts a JOIN pilot_people p ON p.id=a.person_id WHERE p.id=$1",
    id,
  );
  const { rows: cycles } = await pool.query(
    "SELECT id,goal,facts->>'package' AS package,facts->>'anchor' AS date FROM pilot_cycles WHERE person_id=$1 ORDER BY opens_at DESC",
    id,
  );
  const { rows: requests } = await pool.query(
    'SELECT id,kind,note,state,response,created_at,starts_at,ends_at,amount,paid_at FROM member_requests WHERE person_id=$1 ORDER BY created_at DESC',
    id,
  );
  result(res, { ...person, cycles, requests });
});
router.put('/me', async (req, res) => {
  const input = await Joi.object({
    ...profile,
    settings: Joi.object(personalDetails),
  }).validateAsync(req.body);
  await withTransaction(async (db) => {
    await db.query(
      "UPDATE pilot_people SET name=$2,phone=$3,consent=$4,opted_out_at=CASE WHEN $4='granted' THEN NULL ELSE COALESCE(opted_out_at,now()) END,observed_at=now() WHERE id=$1",
      [req.memberId, input.name, input.phone, input.contact ? 'granted' : 'withdrawn'],
    );
    await db.query(
      'UPDATE pilot_cycles SET draft=NULL, draft_kind=NULL,version=version+1 WHERE person_id=$1',
      [req.memberId],
    );
    if (input.settings)
      await db.query(
        'UPDATE member_accounts SET settings=settings || $2::jsonb WHERE person_id=$1',
        [req.memberId, JSON.stringify(input.settings)],
      );
  });
  result(res, true);
});
router.post('/requests', async (req, res) => {
  const input = await Joi.object({
    kind: Joi.string()
      .valid('trial', 'package', 'renewal', 'help', 'booking', 'course', 'membership')
      .required(),
    starts_at: Joi.date()
      .iso()
      .greater('now')
      .when('kind', {
        is: Joi.valid('booking', 'course', 'membership'),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    ends_at: Joi.date()
      .iso()
      .greater(Joi.ref('starts_at'))
      .when('kind', {
        is: Joi.valid('booking', 'course', 'membership'),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    note: Joi.string().trim().min(2).max(500).required(),
  }).validateAsync(req.body);
  await pool.query(
    'INSERT INTO member_requests(person_id,kind,note,starts_at,ends_at) VALUES($1,$2,$3,$4,$5)',
    [req.memberId, input.kind, input.note, input.starts_at, input.ends_at],
  );
  result(res, true);
});
router.patch('/settings', async (req, res) => {
  const values = await Joi.object({
    photo: Joi.alternatives().try(
      Joi.string().valid(
        '/images/avatar-default.svg',
        '/images/avatar-teal.svg',
        '/images/avatar-blue.svg',
        '/images/avatar-purple.svg',
        '/images/avatar-long.svg',
      ),
      Joi.string()
        .max(700000)
        .pattern(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/),
    ),
    ...personalDetails,
    promoEmail: Joi.boolean().strict(),
    promoSms: Joi.boolean().strict(),
    method: Joi.string().valid('Tunai', 'Transfer'),
  })
    .min(1)
    .validateAsync(req.body);
  await pool.query('UPDATE member_accounts SET settings=settings || $2::jsonb WHERE person_id=$1', [
    req.memberId,
    JSON.stringify(values),
  ]);
  result(res, true);
});
router.post('/acknowledge', async (req, res) => {
  await pool.query(
    'UPDATE member_accounts SET acknowledged_at=COALESCE(acknowledged_at,now()) WHERE person_id=$1',
    [req.memberId],
  );
  result(res, true);
});
router.post('/requests/:id/cancel', async (req, res) => {
  const updated = await pool.query(
    "UPDATE member_requests SET state='cancelled' WHERE id=$1 AND person_id=$2 AND (state='pending' OR (state='confirmed' AND kind IN ('booking','course','membership') AND starts_at>now() AND paid_at IS NULL))",
    [req.params.id, req.memberId],
  );
  if (!updated.rowCount) reject('Permintaan tidak dapat dibatalkan.');
  result(res, true);
});
router.put('/credentials', loginLimiter, async (req, res) => {
  const input = await Joi.object({
    current: password,
    email,
    password: Joi.string().min(10).max(72, 'utf8').allow(''),
  }).validateAsync(req.body);
  await withTransaction(async (db) => {
    const {
      rows: [a],
    } = await db.query(
      'SELECT person_id,email,password_hash FROM member_accounts WHERE person_id=$1 FOR UPDATE',
      [req.memberId],
    );
    if (!(await bcrypt.compare(input.current, a.password_hash)))
      reject('Kata sandi saat ini salah.', 400);
    if (input.password && input.password === input.current)
      reject('Gunakan kata sandi baru yang berbeda.', 400);
    if (input.password) {
      a.password_hash = await bcrypt.hash(input.password, 12);
      await db.query('UPDATE member_accounts SET password_hash=$2 WHERE person_id=$1', [
        req.memberId,
        a.password_hash,
      ]);
    }
    if (input.email !== a.email) {
      const existing = await db.query('SELECT 1 FROM member_accounts WHERE email=$1', [
        input.email,
      ]);
      if (existing.rowCount) reject('Alamat email sudah digunakan.');
      await queueAccountEmail(db, a, 'customer', 'change-email', input.email);
    }
    await db.query('DELETE FROM member_sessions WHERE person_id=$1 AND token_hash<>$2', [
      req.memberId,
      digest(tokenOf(req)),
    ]);
  });
  result(res, true);
});
export default router;
