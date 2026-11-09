import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';
import { taskActionLabels } from '../constants/taskActionLabels.js';

export function PilotTaskActionForm({
  task,
  people,
  action,
  review,
  draft,
  note,
  setNote,
  until,
  setUntil,
  owner,
  setOwner,
  busy,
  submit,
}) {
  const t = useT();
  return (
    <>
      <form
        className="pilot-form card"
        onSubmit={(e) => {
          e.preventDefault();
          const extra = { note };
          if (action === 'approve')
            Object.assign(extra, { message: draft, attempt: crypto.randomUUID() });
          if (action === 'accepted' || action === 'failed') extra.attempt = task.pending;
          if (action === 'snooze') extra.until = new Date(until + ':00+07:00').toISOString();
          if (action === 'assign') extra.owner = owner;
          submit(action, extra);
        }}
      >
        <h3>{t(taskActionLabels[action])}</h3>
        {review && (
          <>
            <p>
              {task.name} · {task.phone}
            </p>
            <blockquote>{draft}</blockquote>
            <label>
              <input type="checkbox" required />{' '}
              {t('Saya baru memeriksa transaksi, izin, inbox, penerima dan isi pesan.')}
            </label>
          </>
        )}
        {action === 'snooze' && (
          <label>
            {t('Jadwal berikutnya')} (WIB)
            <input
              type="datetime-local"
              required
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
          </label>
        )}
        {action === 'assign' && (
          <select required value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">{t('Pilih PIC')}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <label>
          {t(review ? 'Referensi sumber yang diperiksa' : 'Catatan atau referensi bukti')}
          <textarea
            required
            minLength={3}
            maxLength={800}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          {t('Simpan')}
        </Button>
      </form>
    </>
  );
}
