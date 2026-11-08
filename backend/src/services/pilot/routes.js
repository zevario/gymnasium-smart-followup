import { pilotScope } from './scope.js';
import { Router } from 'express';
import Joi from 'joi';
import pool from '../../config/database.js';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import { batch, command } from './schema.js';
import {
  attempts,
  importRecord,
  present,
  reject,
  report,
  tasks,
  transaction,
} from './repository.js';
import { reconcile } from './lifecycle.js';
import { execute } from './commands.js';

const router = Router();
router.use(authentication, pilotScope, authorization('staff', 'spv'));
router.get('/tasks', async (_req, res) => {
  const list = await transaction(async (db) => {
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const rows = await tasks(db);
    const byPerson = new Map();
    for (const item of await attempts(db)) {
      if (!byPerson.has(item.person_id)) byPerson.set(item.person_id, []);
      byPerson.get(item.person_id).push(item);
    }
    return rows
      .map((row) => present(row, byPerson.get(row.person_id) || []))
      .sort(
        (a, b) =>
          Number(b.canPrepare) - Number(a.canPrepare) ||
          b.score - a.score ||
          Date.parse(a.dueAt) - Date.parse(b.dueAt),
      );
  });
  res.json({ data: list });
});
router.get('/assignees', async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id,name FROM users WHERE is_active AND pilot_location='bintaro' AND role IN ('staff','spv') ORDER BY name,id",
  );
  res.json({ data: rows });
});
router.get('/reports', authorization('spv'), async (_req, res) =>
  res.json({ data: await report(pool) }),
);
router.get('/policy', async (_req, res) => {
  const {
    rows: [policy],
  } = await pool.query("SELECT paused,changed_at FROM pilot_runtime WHERE location='bintaro'");
  res.json({ data: policy });
});
router.put('/policy', authorization('spv'), async (req, res) => {
  const input = await Joi.object({
    paused: Joi.boolean().strict().required(),
    note: Joi.string().trim().min(3).max(500).required(),
  }).validateAsync(req.body);
  await transaction(async (db) => {
    await db.query(
      "UPDATE pilot_runtime SET paused=$1,changed_at=now(),changed_by=$2 WHERE location='bintaro'",
      [input.paused, req.user.id],
    );
    await db.query('INSERT INTO pilot_rule_events(actor_id,paused,note) VALUES ($1,$2,$3)', [
      req.user.id,
      input.paused,
      input.note,
    ]);
  });
  res.json({ data: input });
});
router.post('/import', authorization('spv'), async (req, res) => {
  const { records } = await batch.validateAsync(req.body, { abortEarly: false });
  const result = await transaction(async (db) => {
    let updated = 0;
    for (const item of records.sort(
      (a, b) =>
        a.customerId.localeCompare(b.customerId) ||
        Date.parse(a.observedAt) - Date.parse(b.observedAt),
    )) {
      const changed = await importRecord(db, item, req.user.id);
      updated += changed;
      if (changed) {
        const {
          rows: [cycle],
        } = await db.query(
          'SELECT c.id FROM pilot_cycles c JOIN pilot_people p ON p.id=c.person_id WHERE p.source_id=$1 AND p.location=$2 AND c.goal=$3 AND c.source_cycle=$4',
          [item.customerId, item.location, item.goal, item.cycleId],
        );
        const [row] = await tasks(db, cycle.id);
        await reconcile(db, row);
      }
    }
    return { updated, unchanged: records.length - updated };
  });
  res.json({ data: result });
});
router.param('id', (req, res, next, id) => {
  if (Joi.string().uuid().validate(id).error)
    return res.status(400).json({ message: 'ID tugas tidak valid.' });
  next();
});
router.get('/tasks/:id/history', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.id,e.action,e.note,e.created_at,u.name FROM pilot_events e
    JOIN pilot_cycles c ON c.id=e.cycle_id JOIN pilot_people p ON p.id=c.person_id LEFT JOIN users u ON u.id=e.actor_id
    WHERE e.cycle_id=$1 AND p.location='bintaro' ORDER BY e.id DESC LIMIT 100`,
    [req.params.id],
  );
  if (!rows.length) reject('Tugas tidak ditemukan.', 404);
  res.json({ data: rows });
});
router.post('/tasks/:id/actions', async (req, res) => {
  const input = await command.validateAsync(req.body);
  const data = await transaction((db) => execute(db, req.params.id, req.user, input));
  res.json({ data });
});
export default router;
