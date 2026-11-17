import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { kinds, states } from '../memberLabels.js';

export function MemberInbox() {
  const [items, setItems] = useState([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () =>
    api('/member-requests')
      .then(setItems)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    api('/member-requests')
      .then(setItems)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="member-inbox">
      <h2>Permintaan customer</h2>
      <button onClick={load}>Perbarui daftar</button>
      <p role="status">{message}</p>
      {!items.length && <p>Belum ada permintaan.</p>}
      {items.map((r) => (
        <article key={r.id}>
          <h3>
            {r.name} · {kinds[r.kind]}
          </h3>
          <p>{r.note}</p>
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
                    const amount = 'Rp ' + r.amount.toLocaleString('id-ID');
                    if (
                      !window.confirm(
                        'Tandai tagihan ' +
                          amount +
                          ' sudah dibayar? Status Lunas tidak dapat diurungkan.',
                      )
                    )
                      return;
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
          <p>
            {states[r.state]} {r.response}
          </p>
          {r.state === 'pending' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const input = Object.fromEntries(new FormData(e.currentTarget));
                if (!input.amount) delete input.amount;
                if (!input.date) delete input.date;
                if (!input.package) delete input.package;
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
              <label>
                Jawaban untuk customer
                <textarea name="response" required minLength={2} maxLength={500} />
              </label>
              <button disabled={busy}>Simpan jawaban</button>
            </form>
          )}
        </article>
      ))}
    </section>
  );
}
