import { useEffect, useState } from 'react';
import { api, dateTime } from '../../../services/pilotApi.js';
import { Button } from '../../../components/Button/Button.jsx';
import { Avatar, Badge } from '../../../components/Controls/Controls.jsx';
import { useT } from '../../../i18n/useLanguage.js';

export function PilotTask({ task, user, people, refresh, close }) {
  const t = useT();
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(task.draft || '');
  const [note, setNote] = useState('');
  const [until, setUntil] = useState('');
  const [owner, setOwner] = useState('');
  const [review, setReview] = useState(false);
  const [draftVersion, setDraftVersion] = useState(task.version);
  const displayedDraft = draftVersion === task.version ? draft : task.draft || '';
  const [handoff, setHandoff] = useState(null);
  const [action, setAction] = useState('');
  useEffect(() => {
    if (!handoff) return;
    const timer = setTimeout(
      () => setHandoff(null),
      Math.max(0, Date.parse(handoff.validUntil) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [handoff]);
  const supervisor = user.roleCode === 'spv';
  const edit = task.ownerId === user.id || supervisor;
  useEffect(() => {
    let active = true;
    api('/pilot/tasks/' + task.id + '/history')
      .then((rows) => {
        if (active) setHistory(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [task.id, task.version]);
  async function submit(kind, extra = {}) {
    setBusy(true);
    setError('');
    try {
      const data = await api('/pilot/tasks/' + task.id + '/actions', 'POST', {
        action: kind,
        version: task.version,
        ...extra,
      });
      setHandoff(data.handoff || null);
      const rows = await refresh();
      const latest = rows.find((row) => row.id === task.id);
      setDraft(latest?.draft || '');
      setDraftVersion(latest?.version);
      setReview(false);
      setAction('');
      setNote('');
    } catch (e) {
      setError(e.message);
      setHandoff(null);
      setReview(false);
      await refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  const closed = task.status === 'Selesai';
  const choose = (kind) => {
    setAction(kind);
    setNote('');
    setError('');
    setReview(false);
  };
  const labels = {
    closed: 'Siklus selesai',
    released: 'PIC dilepas',
    reply: 'Catat balasan',
    claim: 'Tugas diambil',
    assign: 'Pengalihan PIC',
    draft: 'Penyusunan draft',
    approve: 'Persetujuan manual',
    accepted: 'Terkirim manual',
    failed: 'Gagal dikirim',
    snooze: 'Tunda follow-up',
    outcome: 'Catat hasil',
    optout: 'Catat opt-out',
    import: 'Impor sumber',
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside
        className="detail-drawer pilot-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={task.name}
      >
        <header className="drawer-header">
          <Button variant="secondary" onClick={close}>
            {t('Kembali')}
          </Button>
          <Badge>{t(task.status)}</Badge>
        </header>
        <div className="drawer-content">
          <div className="customer-hero">
            <Avatar initials={task.initials} />
            <div>
              <h2>{task.name}</h2>
              <p>
                {task.package} · {t(task.goal)}
              </p>
            </div>
          </div>
          <section className="detail-section">
            <p>{task.context}</p>
            <p>
              {task.phone} · {t('Izin kontak')} · {t(task.permission)}
            </p>
            <p>PIC · {task.owner}</p>
            <p>
              {t('Tenggat')} · {dateTime(task.dueAt)}
            </p>
            <p>
              {t('Waktu sumber')} · {dateTime(task.observedAt)}
            </p>
            {task.nextAt && (
              <p>
                {t('Jadwal berikutnya')} · {dateTime(task.nextAt)}
              </p>
            )}
            {task.reason && <p>{task.reason}</p>}{' '}
            {task.transaction && (
              <p>
                {t('Transaksi terverifikasi')} · {task.transaction}
              </p>
            )}
            <details>
              <summary>
                {t('Skor prioritas')} · {task.score}
              </summary>
              <p>
                {t('Urgensi')} {task.parts.urgency} · {t('Minat')} {task.parts.interest} ·{' '}
                {t('Aktivitas')} {task.parts.activity} · {t('Keterlambatan')} {task.parts.overdue}
              </p>
            </details>
          </section>
          {task.blockReason && <p className="blocked-banner">{t(task.blockReason)}</p>}
          {!task.ownerId && !closed && (
            <Button disabled={busy} onClick={() => submit('claim')}>
              {t('Ambil follow-up')}
            </Button>
          )}
          {edit && task.ownerId && task.canPrepare && (
            <section className="composer pilot-form">
              <h3>{t('Draft pesan')}</h3>
              <Button disabled={busy} onClick={() => submit('draft')}>
                {t(draft ? 'Buat ulang' : 'Buat draft pesan')}
              </Button>
              {task.draft && (
                <>
                  <label>
                    {t('Pesan untuk pelanggan')} · {task.draftKind}
                    <textarea
                      value={displayedDraft}
                      maxLength={500}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setDraftVersion(task.version);
                        setReview(false);
                      }}
                    />
                  </label>
                  <p>{t('Pengiriman manual tersedia pukul 09.00–18.00 WIB.')}</p>
                  <Button
                    disabled={busy || !displayedDraft.trim() || !task.inHours}
                    onClick={() => {
                      choose('approve');
                      setDraft(displayedDraft);
                      setDraftVersion(task.version);
                      setReview(true);
                    }}
                  >
                    {t('Tinjau pesan')}
                  </Button>
                </>
              )}
            </section>
          )}
          {handoff &&
            task.permission === 'Aktif' &&
            !closed &&
            task.version === handoff.version &&
            task.pending === handoff.attempt && (
              <div className="source-box">
                <strong>{t('Disetujui untuk kanal manual')}</strong>
                <p>{handoff.phone}</p>
                <p>{handoff.message}</p>
                <small>
                  {t('Kirim sekali melalui kanal resmi, lalu catat konfirmasinya di sini.')}
                </small>
              </div>
            )}
          {task.pending && edit && (
            <div className="pilot-actions">
              <Button disabled={busy} onClick={() => choose('accepted')}>
                {t('Konfirmasi sudah terkirim')}
              </Button>
              <Button disabled={busy} variant="secondary" onClick={() => choose('failed')}>
                {t('Konfirmasi gagal')}
              </Button>
            </div>
          )}
          <div className="pilot-actions">
            {edit && !closed && !task.pending && (
              <>
                <Button disabled={busy} variant="secondary" onClick={() => choose('snooze')}>
                  {t('Tunda')}
                </Button>
                <Button disabled={busy} variant="secondary" onClick={() => choose('reply')}>
                  {t('Catat balasan')}
                </Button>
                <Button disabled={busy} variant="secondary" onClick={() => choose('outcome')}>
                  {t('Catat hasil')}
                </Button>
              </>
            )}
            {supervisor && (
              <Button disabled={busy} variant="secondary" onClick={() => choose('assign')}>
                {t('Alihkan PIC')}
              </Button>
            )}
            {task.permission === 'Aktif' && (
              <Button disabled={busy} variant="secondary" onClick={() => choose('optout')}>
                {t('Catat opt-out')}
              </Button>
            )}
          </div>
          {action &&
            (action !== 'approve' || (review && draftVersion === task.version && task.draft)) && (
              <form
                className="pilot-form card"
                onSubmit={(e) => {
                  e.preventDefault();
                  const extra = { note };
                  if (action === 'approve')
                    Object.assign(extra, { message: draft, attempt: crypto.randomUUID() });
                  if (action === 'accepted' || action === 'failed') extra.attempt = task.pending;
                  if (action === 'snooze')
                    extra.until = new Date(until + ':00+07:00').toISOString();
                  if (action === 'assign') extra.owner = owner;
                  submit(action, extra);
                }}
              >
                <h3>{t(labels[action])}</h3>
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
            )}
          {error && <p role="alert">{error}</p>}
          <section className="history">
            <h3>{t('Riwayat aktivitas')}</h3>
            {history.map((h) => (
              <p key={h.id}>
                <strong>{t(labels[h.action] || h.action)}</strong> · {h.name} ·{' '}
                {dateTime(h.created_at)}
                <br />
                {h.note}
              </p>
            ))}
          </section>
        </div>
      </aside>
    </div>
  );
}
