import { useEffect, useState } from 'react';
import { api } from '../../services/pilotApi.js';
import { Button } from '../../components/Button/Button.jsx';
import { PageIntro } from '../../components/Controls/Controls.jsx';
import { useT } from '../../i18n/useLanguage.js';

export function PilotSettings({ supervisor, refresh }) {
  const t = useT(),
    [body, setBody] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState(null),
    [reason, setReason] = useState(''),
    [policyError, setPolicyError] = useState('');
  useEffect(() => {
    api('/pilot/policy')
      .then(setPolicy)
      .catch((e) => setPolicyError(e.message));
  }, []);
  function example() {
    const now = Date.now();
    const base = {
      location: 'bintaro',
      consent: 'unknown',
      complaint: false,
      transaction: null,
      observedAt: new Date(now).toISOString(),
      cycleId: 'contoh-01',
      phone: '',
    };
    setBody(
      JSON.stringify(
        {
          records: [
            {
              ...base,
              customerId: 'contoh-trial',
              name: 'Contoh Trial',
              goal: 'trial',
              package: 'Trial Bintaro',
              anchor: new Date(now - 25 * 3600000).toISOString(),
            },
            {
              ...base,
              customerId: 'contoh-renewal',
              name: 'Contoh Renewal',
              goal: 'renewal',
              membershipState: 'renewable',
              package: 'Open Gym',
              anchor: new Date(now + 2 * 86400000).toISOString(),
            },
          ],
        },
        null,
        2,
      ),
    );
  }
  return (
    <>
      <PageIntro
        eyebrow="BINTARO"
        title={t('Pengaturan')}
        subtitle={t('Aturan kontak dan sumber data operasional')}
      />
      <section className="card pilot-form">
        <h2>{t('Aturan kontak')}</h2>
        <p>09.00–18.00 WIB · {t('Jeda minimal 48 jam lintas tujuan.')}</p>
        <p>
          {t(
            'Maksimal dua kontak per siklus, dua per tujuan dan tiga lintas tujuan dalam tujuh hari.',
          )}
        </p>
        <p>{t('Kanal manual dengan pemeriksaan petugas sebelum setiap pengiriman.')}</p>
      </section>
      {policy && (
        <form
          className="card pilot-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const updated = await api('/pilot/policy', 'PUT', {
                paused: !policy.paused,
                note: reason,
              });
              setPolicy(updated);
              setReason('');
              setPolicyError('');
            } catch (err) {
              setPolicyError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <strong>{t(policy.paused ? 'Pengiriman dijeda' : 'Pengiriman manual aktif')}</strong>
          {supervisor && (
            <>
              <label>
                {t('Alasan perubahan')}
                <input
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <Button disabled={busy} type="submit">
                {t(policy.paused ? 'Aktifkan pengiriman' : 'Jeda pengiriman')}
              </Button>
            </>
          )}
        </form>
      )}
      {policyError && <p role="alert">{policyError}</p>}
      {supervisor && (
        <form
          className="card pilot-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage('');
            try {
              const result = await api('/pilot/import', 'POST', JSON.parse(body));
              setMessage(
                t('Diperbarui') +
                  ' ' +
                  result.updated +
                  ' · ' +
                  t('Sudah tercatat') +
                  ' ' +
                  result.unchanged,
              );
              await refresh();
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{t('Impor trial dan paket')}</h2>
          <p>
            {t(
              'Periksa data dan waktu observasi sumber sebelum menyimpan. ID pelanggan dan siklus harus stabil.',
            )}
          </p>
          <label>
            {t('Buka file JSON')}
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 1000000) {
                    setMessage(t('Batas file 1 MB'));
                    return;
                  }
                  setBody(await file.text());
                }
              }}
            />
          </label>
          <Button variant="secondary" onClick={example}>
            {t('Lihat contoh format')}
          </Button>
          <label>
            {t('Pratinjau data')}
            <textarea required rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <Button disabled={busy} type="submit">
            {t('Impor data')}
          </Button>
          <p role="status">{message}</p>
        </form>
      )}
    </>
  );
}
