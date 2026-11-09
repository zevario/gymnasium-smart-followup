import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';

export function FollowUpIdentity({ c }) {
  const t = useT();
  return (
    <div className="customer-hero">
      <Avatar initials={c.initials} />
      <div>
        <h2>{t(c.name)}</h2>
        <p>
          {t(c.package)} {t('· ')}
          {t(c.goal)}
        </p>
      </div>
      <button className="more-button">{t('•••')}</button>
    </div>
  );
}
