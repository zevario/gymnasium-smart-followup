import { useT } from '../../../shared/i18n/useLanguage.js';

export function FollowUpContact({ c }) {
  const t = useT();
  return (
    <div className="contact-line">
      <span>{t(c.phone)}</span>
      <span className={c.permission === 'Aktif' ? 'permission-active' : 'permission-off'}>
        <i />
        {t(c.permission === 'Aktif' ? 'Izin WhatsApp aktif' : 'Izin WhatsApp ditarik')}
      </span>
    </div>
  );
}
