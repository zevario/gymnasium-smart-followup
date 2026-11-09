import { useT } from '../../../shared/i18n/useLanguage.js';

export function ContactTimingFields({ delay, setDelay }) {
  const t = useT();
  return (
    <div className="form-grid">
      <label>
        {t('Jam operasional ')}
        <div className="dual-input">
          <input defaultValue="09.00" />
          <span>{t('hingga')}</span>
          <input defaultValue="18.00" />
        </div>
      </label>
      <label>
        {t('Zona waktu ')}
        <select defaultValue="Asia/Jakarta">
          <option value={'Asia/Jakarta'}>{t('Asia/Jakarta')}</option>
          <option value={'Asia/Makassar'}>{t('Asia/Makassar')}</option>
          <option value={'Asia/Jayapura'}>{t('Asia/Jayapura')}</option>
        </select>
      </label>
      <label>
        {t('Jeda minimum kontak ')}
        <select value={delay} onChange={(event) => setDelay(Number(event.target.value))}>
          {[3, 4, 5, 6, 7].map((days) => (
            <option key={days} value={days}>
              {t(days)} {t('hari')}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('Maks. kontak proaktif ')}
        <div className="suffix-input">
          <input defaultValue="3" />
          <span>{t('per 7 hari berjalan')}</span>
        </div>
      </label>
    </div>
  );
}
