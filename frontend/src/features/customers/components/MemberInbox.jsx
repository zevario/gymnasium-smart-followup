import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import './memberManagement.css';
import { kinds, states } from '../memberLabels.js';

export function MemberInbox() {
  const [items, setItems] = useState([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await api('/member-requests'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    api('/member-requests')
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="member-inbox">
      <header className="member-inbox-heading">
        <div>
          <h2>Permintaan pelanggan</h2>
          <p>Tinjau pengajuan dan kirim jawaban kepada pelanggan.</p>
        </div>
        <button type="button" className="inbox-refresh" disabled={loading || busy} onClick={load}>
          {loading ? 'Memuat…' : 'Perbarui daftar'}
        </button>
      </header>
      {message && (
        <p className="inbox-feedback" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="inbox-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p role="status" className="inbox-empty">
          Memuat permintaan pelanggan…
        </p>
      )}
      {!loading && !error && !items.length && <p className="inbox-empty">Belum ada permintaan.</p>}
      {items.map((r) => (
        <article className="inbox-request" key={r.id}>
          <header className="inbox-request-heading">
            <h3>
              {r.name}
              <span className="inbox-kind">{kinds[r.kind]}</span>
            </h3>
            <span className={'inbox-state inbox-state-' + r.state}>{states[r.state]}</span>
          </header>
          <p className="inbox-note">{r.note}</p>
          {r.starts_at && (
            <p>
              {new Date(r.starts_at).toLocaleString('id-ID')} –{' '}
              {new Date(r.ends_at).toLocaleString('id-ID')}
            </p>
          )}
          {r.state === 'confirmed' && r.amount > 0 && (
            <p>
              Rp {r.amount.toLocaleString('id-ID')} ·{' '}
              {r.paid_at ? (
                'Lunas'
              ) : (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api('/member-requests/' + r.id + '/paid', 'POST', {});
                      await load();
                    } catch (e) {
                      setMessage(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Konfirmasi pembayaran diterima
                </button>
              )}
            </p>
          )}
          {r.response && (
            <p className="inbox-response">
              <strong>Jawaban petugas</strong>
              {r.response}
            </p>
          )}
          {r.state === 'pending' && (
            <details className="inbox-review">
              <summary>Tinjau dan jawab permintaan</summary>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = Object.fromEntries(new FormData(e.currentTarget));
                  if (!input.amount) delete input.amount;
                  if (!input.date) delete input.date;
                  if (!input.package) delete input.package;
                  setMessage('');
                  setBusy(true);
                  try {
                    await api('/member-requests/' + r.id, 'POST', input);
                    await load();
                    setMessage('Jawaban tersimpan.');
                  } catch (error) {
                    setMessage(error.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Keputusan
                  <select name="state">
                    <option value="confirmed">Konfirmasi</option>
                    <option value="declined">Tolak</option>
                  </select>
                </label>
                {['trial', 'package', 'renewal'].includes(r.kind) && (
                  <>
                    <label>
                      Nama {r.kind === 'trial' ? 'trial' : 'paket'} saat dikonfirmasi
                      <input name="package" maxLength={100} />
                    </label>
                    <label>
                      {r.kind === 'trial' ? 'Tanggal trial selesai' : 'Tanggal akhir paket'}
                      <input name="date" type="date" />
                    </label>
                  </>
                )}
                <label>
                  Nominal tagihan (Rp, opsional)
                  <input name="amount" type="number" min="0" max="2000000000" />
                </label>
                <label className="inbox-wide">
                  Jawaban untuk pelanggan
                  <textarea
                    name="response"
                    placeholder="Tulis hasil peninjauan dan langkah selanjutnya…"
                    rows={3}
                    required
                    minLength={2}
                    maxLength={500}
                  />
                </label>
                <div className="inbox-form-footer">
                  <small>Jawaban akan ditampilkan kepada pelanggan.</small>
                  <button disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan jawaban'}</button>
                </div>
              </form>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}
