import { useT } from '../../../shared/i18n/useLanguage.js';

export function ConnectionStatusList({ connection }) {
  const t = useT();
  return (
    <dl className="system-connections">
      <div>
        <dt>{t('Data membership')}</dt>
        <dd>{t(connection)}</dd>
      </div>
      <div>
        <dt>{t('Kanal pesan')}</dt>
        <dd>{t(connection)}</dd>
      </div>
      <div>
        <dt>{t('Layanan AI')}</dt>
        <dd>{t(connection)}</dd>
      </div>
    </dl>
  );
}
