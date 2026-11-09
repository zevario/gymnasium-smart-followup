import { useT } from '../../../shared/i18n/useLanguage.js';
import { priorityLabel } from '../../followups/services/followupRules.js';
import { Avatar } from '../../../shared/components/Avatar.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Icon } from '../../../shared/components/Icon.jsx';

export function CustomerRow({ customer: c, onOpen }) {
  const t = useT();
  const label = priorityLabel(c.score);
  return (
    <button className="customer-row" onClick={() => onOpen(c)}>
      <div className="customer-main">
        <Avatar initials={c.initials} />
        <div>
          <strong>{t(c.name)}</strong>
          <span>{t(c.package)}</span>
        </div>
      </div>
      <div className="row-cell">
        <small>{t('Tujuan')}</small>
        <Badge tone={c.goal === 'Trial' ? 'blue' : 'neutral'}>{t(c.goal)}</Badge>
      </div>
      <div className="row-cell priority-cell">
        <small>{t('Prioritas')}</small>
        <span>
          <b>{t(c.score)}</b>
          <Badge tone={label.toLowerCase()}>{t(label)}</Badge>
        </span>
      </div>
      <div className="row-cell">
        <small>{t('Tenggat')}</small>
        <strong>{t(c.deadline)}</strong>
        <span>{t(c.context)}</span>
      </div>
      <div className="row-cell owner-cell">
        <small>{t('PIC')}</small>
        <span>
          {c.owner === 'Belum ditugaskan' ? (
            <i className="empty-avatar">{t('?')}</i>
          ) : (
            <Avatar
              initials={c.owner
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0])
                .join('')}
            />
          )}
          {t(' ')}
          {t(c.owner)}
        </span>
      </div>
      <span className="review-link">
        {t('Tinjau ')}
        <Icon name="chevron" size={15} />
      </span>
    </button>
  );
}
