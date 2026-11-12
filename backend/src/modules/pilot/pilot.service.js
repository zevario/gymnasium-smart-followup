import { withTransaction } from '../../database/transaction.js';
import {
  attempts,
  importRecord,
  findImportedCycle,
  savePolicy,
  present,
  tasks,
} from './pilot.repository.js';
import { reconcile } from './pilot.lifecycle.js';

export async function listTasks() {
  return withTransaction(async (db) => {
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
}

export async function importBatch(records, actorId) {
  return withTransaction(async (db) => {
    let updated = 0;
    // A consistent customer order keeps concurrent batches from locking people in opposite orders.
    for (const item of [...records].sort(
      (a, b) =>
        a.customerId.localeCompare(b.customerId) ||
        Date.parse(a.observedAt) - Date.parse(b.observedAt),
    )) {
      const changed = await importRecord(db, item, actorId);
      updated += changed;
      if (changed) {
        const cycle = await findImportedCycle(db, item);
        const [row] = await tasks(db, cycle.id);
        await reconcile(db, row);
      }
    }
    return { updated, unchanged: records.length - updated };
  });
}

export async function updatePolicy(input, actorId) {
  await withTransaction((db) => savePolicy(db, input, actorId));
  return input;
}
