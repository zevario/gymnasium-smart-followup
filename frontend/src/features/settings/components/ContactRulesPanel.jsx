import { FollowUpCycleRules } from './FollowUpCycleRules.jsx';
import { ContactTimingFields } from './ContactTimingFields.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function ContactRulesPanel({ delay, setDelay, readOnly, notify }) {
  const t = useT();
  return (
    <section className="card settings-card">
      <div className="setting-section">
        <h2>{t('Waktu dan batas kontak')}</h2>
        <p>{t('Aturan ini membantu tim menghubungi member pada waktu yang sesuai. ')}</p>
        <ContactTimingFields delay={delay} setDelay={setDelay} />
      </div>
      <FollowUpCycleRules />
      <div className="settings-footer">
        <p>{t('Konfigurasi contoh untuk validasi operasional')}</p>
        <Button
          onClick={() => {
            if (!readOnly) {
              try {
                localStorage.setItem('gymnasyum-followup-days', String(delay));
                notify('Pengaturan demo berhasil disimpan');
              } catch {
                notify('Pengaturan gagal disimpan di browser');
              }
            }
          }}
        >
          {t('Simpan perubahan ')}
        </Button>
      </div>
    </section>
  );
}
