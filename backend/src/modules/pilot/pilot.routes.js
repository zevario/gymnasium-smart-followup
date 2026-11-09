import { Router } from 'express';
import Joi from 'joi';
import pool from '../../database/pool.js';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import { pilotScope } from './pilot.scope.js';
import { batch, command, policyUpdate } from './pilot.schema.js';
import { listAssignees, readPolicy, report, taskHistory, transaction } from './pilot.repository.js';
import { importBatch, listTasks, updatePolicy } from './pilot.service.js';
import { execute } from './pilot.commands.js';

const router = Router();
router.use(authentication, pilotScope, authorization('staff', 'spv'));

router.get('/tasks', async (_req, res) => {
  res.json({ data: await listTasks() });
});

router.get('/assignees', async (_req, res) => {
  res.json({ data: await listAssignees() });
});

router.get('/reports', authorization('spv'), async (_req, res) => {
  res.json({ data: await report(pool) });
});

router.get('/policy', async (_req, res) => {
  res.json({ data: await readPolicy() });
});

router.put('/policy', authorization('spv'), async (req, res) => {
  const input = await policyUpdate.validateAsync(req.body);
  res.json({ data: await updatePolicy(input, req.user.id) });
});

router.post('/import', authorization('spv'), async (req, res) => {
  const { records } = await batch.validateAsync(req.body, { abortEarly: false });
  res.json({ data: await importBatch(records, req.user.id) });
});

router.param('id', (req, res, next, id) => {
  if (Joi.string().uuid().validate(id).error) {
    return res.status(400).json({ message: 'ID tugas tidak valid.' });
  }
  next();
});

router.get('/tasks/:id/history', async (req, res) => {
  res.json({ data: await taskHistory(req.params.id) });
});

router.post('/tasks/:id/actions', async (req, res) => {
  const input = await command.validateAsync(req.body);
  const data = await transaction((db) => execute(db, req.params.id, req.user, input));
  res.json({ data });
});

export default router;
