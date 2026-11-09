import { api } from '../../../shared/api/pilotApi.js';
import { Button } from '../../../shared/components/Button.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotImportForm({
  setBusy,
  setMessage,
  body,
  refresh,
  setBody,
  example,
  busy,
  message,
}) {
  const t = useT();
  return (
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
  );
}
