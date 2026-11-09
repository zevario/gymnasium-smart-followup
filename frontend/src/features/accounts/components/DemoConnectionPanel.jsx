import { ConnectionStatusList } from './ConnectionStatusList.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function DemoConnectionPanel({ connection, setConnection }) {
  const t = useT();
  return (
    <section className="card system-panel">
      <h2>{t('Kesehatan koneksi')}</h2>
      <p>{t('Mode demo lokal · belum ada integrasi ke sumber data atau penyedia pesan.')}</p>
      <ConnectionStatusList connection={connection} />
      <Button
        variant="secondary"
        onClick={() => setConnection('Demo lokal — koneksi belum dikonfigurasi')}
      >
        {t('Periksa koneksi')}
      </Button>
    </section>
  );
}
