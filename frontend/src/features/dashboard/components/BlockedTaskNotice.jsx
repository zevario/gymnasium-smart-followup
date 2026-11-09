import { useT } from '../../../shared/i18n/useLanguage.js';

import { Icon } from '../../../shared/components/Icon.jsx';

export function BlockedTaskNotice({ blockedCustomers, onOpen }) {
  const t = useT();
  return (
    <section className="attention">
      <span className="attention-icon">{t('!')}</span>
      <div>
        <strong>{t('Perlu perhatian')}</strong>
        <p>
          {t(blockedCustomers.length)} {t('tugas diblokir karena izin kontak atau data paket. ')}
        </p>
      </div>
      <button disabled={!blockedCustomers.length} onClick={() => onOpen(blockedCustomers[0])}>
        <Icon name="chevron" />
      </button>
    </section>
  );
}
