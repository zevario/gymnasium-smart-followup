import pool from '../../database/pool.js';
import { reject } from '../../utils/http-error.js';
import { evaluate, schedule } from './pilot.policy.js';

export async function event(db, id, actor, action, note = '') {
  await db.query('INSERT INTO pilot_events(cycle_id,actor_id,action,note) VALUES ($1,$2,$3,$4)', [
    id,
    actor,
    action,
    note,
  ]);
}
const selectTasks = `SELECT c.*, p.name,p.phone,p.consent,p.complaint,p.opted_out_at,p.observed_at AS person_observed,
  u.name AS owner_name FROM pilot_cycles c JOIN pilot_people p ON p.id=c.person_id
  LEFT JOIN users u ON u.id=c.owner_id WHERE p.location='bintaro'`;
export async function tasks(db, id) {
  const result = await db.query(
    selectTasks +
      (id ? ' AND c.id=$1' : ' AND c.opens_at<=now()') +
      ' ORDER BY c.due_at,c.created_at,c.id',
    id ? [id] : [],
  );
  return result.rows;
}
export async function attempts(db, person) {
  const result = await db.query(
    `SELECT a.id,a.state,a.actor_id,a.cycle_id,a.accepted_at,c.goal,c.person_id
    FROM pilot_attempts a JOIN pilot_cycles c ON c.id=a.cycle_id JOIN pilot_people p ON p.id=c.person_id
    WHERE p.location='bintaro' AND (a.state='unknown' OR a.state='accepted')` +
      (person ? ' AND p.id=$1' : ''),
    person ? [person] : [],
  );
  return result.rows;
}
export function present(row, history) {
  const state = evaluate(row, history);
  const format = (value) =>
    new Date(value).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  return {
    ...state,
    id: row.id,
    personId: row.person_id,
    name: row.name,
    initials: row.name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join(''),
    phone: '•••• ' + row.phone.slice(-4),
    package: row.facts.package,
    goal: row.goal === 'trial' ? 'Trial' : 'Perpanjangan',
    context:
      (row.goal === 'trial' ? 'Trial selesai ' : 'Paket berakhir ') + format(row.facts.anchor),
    dueAt: row.due_at,
    deadline: format(row.due_at),
    observedAt: row.observed_at,
    owner: row.owner_name || 'Belum ditugaskan',
    ownerId: row.owner_id,
    permission: row.consent === 'granted' && !row.opted_out_at ? 'Aktif' : 'Perlu verifikasi',
    draft: row.draft,
    draftKind: row.draft_kind,
    version: row.version,
    reason: row.reason,
    transaction: row.facts.transaction,
    openedAt: row.opens_at,
    expiresAt: row.expires_at,
    nextAt: row.next_at,
  };
}
export async function importRecord(db, data, actor) {
  const {
    location,
    customerId,
    name,
    phone,
    consent,
    complaint,
    observedAt,
    cycleId,
    goal,
    ...facts
  } = data;
  if (Date.parse(observedAt) > Date.now())
    reject('Waktu observasi sumber berada di masa depan.', 400);
  if (
    facts.transaction &&
    (!facts.transactionAt || Date.parse(facts.transactionAt) > Date.parse(observedAt))
  )
    reject('Verifikasi waktu transaksi sumber.', 400);
  const person = await db.query(
    `INSERT INTO pilot_people(location,source_id,name,phone,consent,complaint,observed_at)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(location,source_id) DO NOTHING RETURNING id`,
    [location, customerId, name, phone, consent, complaint, observedAt],
  );
  const {
    rows: [p],
  } = await db.query('SELECT * FROM pilot_people WHERE location=$1 AND source_id=$2 FOR UPDATE', [
    location,
    customerId,
  ]);
  if (
    +new Date(observedAt) === +p.observed_at &&
    (p.name !== name || p.phone !== phone || p.consent !== consent || p.complaint !== complaint)
  )
    reject('Dua snapshot pelanggan berbeda memakai waktu sumber yang sama.');
  if (+new Date(observedAt) > +p.observed_at) {
    await db.query(
      'UPDATE pilot_people SET name=$2,phone=$3,consent=$4,complaint=$5,observed_at=$6 WHERE id=$1',
      [p.id, name, phone, consent, complaint, observedAt],
    );
    if (p.name !== name || p.phone !== phone || p.consent !== consent || p.complaint !== complaint)
      await db.query(
        'UPDATE pilot_cycles SET draft=NULL,draft_kind=NULL,version=version+1 WHERE person_id=$1',
        [p.id],
      );
  }
  if (facts.consentAt && Date.parse(facts.consentAt) > Date.parse(observedAt))
    reject('Tanggal bukti izin melewati waktu observasi.', 400);
  const times = schedule(goal, facts.anchor, Date.now());
  const values = [
    p.id,
    goal,
    cycleId,
    JSON.stringify(facts),
    observedAt,
    new Date(times.opens),
    new Date(times.due),
    new Date(times.expires),
  ];
  const result = await db.query(
    `INSERT INTO pilot_cycles(person_id,goal,source_cycle,facts,observed_at,opens_at,due_at,expires_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(person_id,goal,source_cycle) DO UPDATE
    SET facts=excluded.facts,observed_at=excluded.observed_at,opens_at=excluded.opens_at,expires_at=excluded.expires_at,
    draft=NULL,draft_kind=NULL,version=pilot_cycles.version+1
    WHERE excluded.observed_at>pilot_cycles.observed_at RETURNING id`,
    values,
  );
  if (result.rowCount)
    await event(
      db,
      result.rows[0].id,
      actor,
      'import',
      facts.transaction
        ? 'Transaksi terverifikasi: ' + facts.transaction
        : 'Snapshot sumber diterima.',
    );
  else {
    const comparison = await db.query(
      'SELECT observed_at=$4 AND facts<>$5::jsonb AS conflict FROM pilot_cycles WHERE person_id=$1 AND goal=$2 AND source_cycle=$3',
      values.slice(0, 3).concat(observedAt, JSON.stringify(facts)),
    );
    if (comparison.rows[0]?.conflict)
      reject('Dua snapshot siklus berbeda memakai waktu sumber yang sama.');
  }
  return result.rowCount || person.rowCount;
}
export async function report(db) {
  const { rows } = await db.query(`SELECT c.goal, count(*)::int AS opened,
    count(*) FILTER(WHERE c.eligible_at IS NOT NULL AND c.expires_at<=now())::int AS mature,
    count(*) FILTER(WHERE c.eligible_at IS NOT NULL AND c.expires_at<=now() AND c.facts->>'transaction' IS NOT NULL AND (c.facts->>'transactionAt')::timestamptz >= CASE WHEN c.goal='trial' THEN (c.facts->>'anchor')::timestamptz ELSE c.opens_at END AND (c.facts->>'transactionAt')::timestamptz<c.expires_at)::int AS converted,
    count(*) FILTER(WHERE EXISTS(SELECT 1 FROM pilot_attempts a WHERE a.cycle_id=c.id AND a.state='accepted'))::int AS contacted
    FROM pilot_cycles c JOIN pilot_people p ON p.id=c.person_id WHERE p.location='bintaro' AND c.opens_at<=now()
    GROUP BY c.goal ORDER BY c.goal`);
  return rows;
}

export async function listAssignees() {
  const { rows } = await pool.query(
    "SELECT id,name FROM users WHERE is_active AND pilot_location='bintaro' AND role IN ('staff','spv') ORDER BY name,id",
  );
  return rows;
}

export async function readPolicy() {
  const {
    rows: [policy],
  } = await pool.query("SELECT paused,changed_at FROM pilot_runtime WHERE location='bintaro'");
  return policy;
}

export async function taskHistory(cycleId) {
  const { rows } = await pool.query(
    `SELECT e.id,e.action,e.note,e.created_at,u.name FROM pilot_events e
    JOIN pilot_cycles c ON c.id=e.cycle_id JOIN pilot_people p ON p.id=c.person_id LEFT JOIN users u ON u.id=e.actor_id
    WHERE e.cycle_id=$1 AND p.location='bintaro' ORDER BY e.id DESC LIMIT 100`,
    [cycleId],
  );
  if (!rows.length) reject('Tugas tidak ditemukan.', 404);
  return rows;
}

export async function findImportedCycle(db, record) {
  const {
    rows: [cycle],
  } = await db.query(
    'SELECT c.id FROM pilot_cycles c JOIN pilot_people p ON p.id=c.person_id WHERE p.source_id=$1 AND p.location=$2 AND c.goal=$3 AND c.source_cycle=$4',
    [record.customerId, record.location, record.goal, record.cycleId],
  );
  return cycle;
}

export async function savePolicy(db, input, actorId) {
  await db.query(
    "UPDATE pilot_runtime SET paused=$1,changed_at=now(),changed_by=$2 WHERE location='bintaro'",
    [input.paused, actorId],
  );
  await db.query('INSERT INTO pilot_rule_events(actor_id,paused,note) VALUES ($1,$2,$3)', [
    actorId,
    input.paused,
    input.note,
  ]);
}
