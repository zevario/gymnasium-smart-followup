import pool from '../../database/pool.js';
import { withTransaction } from '../../database/transaction.js';
import { attempts, event, tasks } from './pilot.repository.js';
import { evaluate } from './pilot.policy.js';

export async function reconcile(db, row) {
  const state = evaluate(row, await attempts(db, row.person_id));
  if (!row.eligible_at && state.canPrepare) {
    await db.query(
      'UPDATE pilot_cycles SET eligible_at=now() WHERE id=$1 AND eligible_at IS NULL',
      [row.id],
    );
  }
  if (state.status === 'Selesai' && row.status !== 'closed') {
    const reason = row.facts.transaction
      ? 'transaction_confirmed'
      : Date.parse(row.expires_at) <= Date.now()
        ? 'window_expired'
        : 'attempt_limit_reached';
    await db.query(
      "UPDATE pilot_cycles SET status='closed',reason=$2,draft=NULL,version=version+1 WHERE id=$1",
      [row.id, reason],
    );
    await event(db, row.id, null, 'closed', reason);
  }
}
export function startLifecycle() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const { rows } =
        await pool.query(`SELECT c.id,c.person_id FROM pilot_cycles c JOIN pilot_people p ON p.id=c.person_id
          WHERE c.status<>'closed' AND c.opens_at<=now() AND p.location='bintaro' ORDER BY p.id,c.id`);
      for (const item of rows) {
        await withTransaction(async (db) => {
          const locked = await db.query(
            'SELECT id FROM pilot_people WHERE id=$1 FOR UPDATE SKIP LOCKED',
            [item.person_id],
          );
          if (!locked.rowCount) return;
          const [row] = await tasks(db, item.id);
          if (row.owner_id) {
            const user = await db.query(
              "SELECT id FROM users WHERE id=$1 AND is_active AND pilot_location='bintaro' AND role IN ('staff','spv')",
              [row.owner_id],
            );
            if (!user.rowCount) {
              await db.query(
                'UPDATE pilot_cycles SET owner_id=NULL,version=version+1 WHERE id=$1',
                [row.id],
              );
              await event(db, row.id, null, 'released', 'Petugas tidak aktif atau berganti peran.');
            }
          }
          await reconcile(db, row);
        });
      }
    } catch (e) {
      console.error('Pilot lifecycle error', e.code || e.name);
    } finally {
      running = false;
    }
  };
  run();
  const timer = setInterval(run, 60000);
  return () => clearInterval(timer);
}
