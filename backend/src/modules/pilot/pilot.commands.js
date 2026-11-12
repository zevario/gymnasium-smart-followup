import { evaluate } from './pilot.policy.js';
import { reject } from '../../utils/http-error.js';
import { attempts, event, tasks } from './pilot.repository.js';
import { draftFor } from './pilot.drafts.js';

export async function execute(db, id, user, input) {
  // Every writer takes the person lock first, including import. Caps span all cycles.
  const lock = await db.query(
    `SELECT p.id FROM pilot_people p JOIN pilot_cycles c ON c.person_id=p.id
    WHERE c.id=$1 AND p.location='bintaro' FOR UPDATE OF p`,
    [id],
  );
  if (!lock.rowCount) reject('Tugas tidak ditemukan.', 404);
  const [row] = await tasks(db, id);
  const { action, note, attempt } = input;
  const supervisor = user.role === 'spv';
  const own = row.owner_id === user.id;
  const history = await attempts(db, row.person_id);
  const state = evaluate(row, history);
  if (attempt) {
    const {
      rows: [previous],
    } = await db.query('SELECT * FROM pilot_attempts WHERE id=$1', [attempt]);
    if (previous && (previous.cycle_id !== id || (!supervisor && previous.actor_id !== user.id)))
      reject('Referensi pengiriman tidak cocok.');
    if (
      previous &&
      ((action === 'approve' && previous.message === input.message) || previous.state === action)
    )
      return { message: 'Permintaan sudah tercatat. Periksa riwayat sebelum melanjutkan.' };
  }
  if (row.version !== input.version) reject('Data berubah. Muat ulang tugas dan tinjau kembali.');
  if (!own && !supervisor && !['claim', 'optout'].includes(action))
    reject('Tugas ini milik petugas lain.', 403);
  const update = async (fields, values = []) =>
    db.query('UPDATE pilot_cycles SET ' + fields + ', version=version+1 WHERE id=$1', [
      id,
      ...values,
    ]);
  let detail = note || '',
    handoff;
  if (action === 'claim') {
    if (row.owner_id || state.status === 'Selesai') reject('Tugas sudah ditangani.');
    await update('owner_id=$2', [user.id]);
  } else if (action === 'assign') {
    if (!supervisor) reject('Pengalihan memerlukan supervisor.', 403);
    const assignee = await db.query(
      "SELECT name FROM users WHERE id=$1 AND pilot_location='bintaro' AND role IN ('staff','spv') AND is_active",
      [input.owner],
    );
    if (!assignee.rowCount) reject('Pilih petugas aktif.', 400);
    await update('owner_id=$2', [input.owner]);
    detail = assignee.rows[0].name + ' · ' + note;
  } else if (action === 'optout') {
    await db.query(
      'UPDATE pilot_people SET opted_out_at=COALESCE(opted_out_at,now()) WHERE id=$1',
      [row.person_id],
    );
    await db.query(
      'UPDATE pilot_cycles SET draft=NULL,draft_kind=NULL,version=version+1 WHERE person_id=$1',
      [row.person_id],
    );
  } else if (action === 'draft' || action === 'approve') {
    if (!state.canPrepare || !row.owner_id)
      reject(state.blockReason || 'Tugas belum tersedia untuk tindakan ini.');
    if (action === 'draft') {
      const draft = await draftFor(row);
      await update('draft=$2,draft_kind=$3', [draft.message, draft.kind]);
      detail = draft.kind;
    } else {
      const policy = await db.query(
        "SELECT paused FROM pilot_runtime WHERE location='bintaro' FOR SHARE",
      );
      if (policy.rows[0].paused) reject('Supervisor telah menjeda pengiriman.');
      if (!row.draft || !state.inHours)
        reject('Periksa draft, jam kontak 09.00–18.00 WIB, dan snapshot sumber maksimal 24 jam.');
      await db.query(
        `INSERT INTO pilot_attempts(id,cycle_id,actor_id,message,verification,state)
        VALUES($1,$2,$3,$4,$5,'unknown')`,
        [attempt, id, user.id, input.message, note],
      );
      await update('draft=NULL,draft_kind=NULL');
      handoff = {
        phone: row.phone,
        message: input.message,
        attempt,
        version: row.version + 1,
        validUntil: new Date(
          Math.min(Date.now() + 15 * 60000, Date.parse(row.expires_at), state.contactEndsAt),
        ).toISOString(),
      };
      detail = 'Pesan diperiksa untuk pengiriman manual. ' + note;
    }
  } else if (action === 'accepted' || action === 'failed') {
    const changed = await db.query(
      `UPDATE pilot_attempts SET state=$3,
      accepted_at=CASE WHEN $3='accepted' THEN now() ELSE NULL END
      WHERE id=$1 AND cycle_id=$2 AND state='unknown' RETURNING id`,
      [attempt, id, action],
    );
    if (!changed.rowCount) reject('Status pengiriman sudah berubah.');
    await update('reason=$2', [note]);
  } else if (action === 'reply') {
    if (state.pending || state.status === 'Selesai')
      reject('Periksa status pengiriman dan siklus terlebih dahulu.');
    await update("status='reply',reason=$2,next_at=NULL,draft=NULL", [note]);
  } else if (action === 'snooze') {
    if (
      state.pending ||
      state.status === 'Selesai' ||
      Date.parse(input.until) <= Date.now() ||
      Date.parse(input.until) >= Date.parse(row.expires_at)
    )
      reject('Pilih waktu mendatang sebelum akhir siklus yang masih aktif.');
    await update("status='snoozed',next_at=$2,reason=$3,draft=NULL", [input.until, note]);
  } else if (action === 'outcome') {
    if (state.pending || state.status === 'Selesai')
      reject('Periksa status tugas atau selesaikan konfirmasi pengiriman dahulu.');
    await update("status='closed',reason=$2,draft=NULL", [note]);
  }
  await event(db, id, user.id, action, detail);
  return { message: 'Tersimpan', handoff };
}
