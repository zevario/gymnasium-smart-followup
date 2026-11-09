import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotContactRules() {
  const t = useT();
  return (
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
  );
}
