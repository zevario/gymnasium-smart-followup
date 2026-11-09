import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Icon } from '../../../shared/components/Icon.jsx';

export function MemberRow({ c, onOpen, i }) {
  const t = useT();
  return (
    <button className="member-row" key={c.id} onClick={() => onOpen(c)}>
      <span className="customer-main">
        <Avatar initials={c.initials} />
        <span>
          <strong>{t(c.name)}</strong>
          <small>{t(c.package)}</small>
        </span>
      </span>
      <Badge tone={c.blockReason ? 'warning' : 'active'}>
        {t(c.blockReason ? 'Perlu ditinjau' : i === 1 || i === 4 ? 'Trial aktif' : 'Aktif')}
      </Badge>
      <span>{t(i % 2 ? '13 Okt 2026' : '12 Okt 2026')}</span>
      <span className={c.permission === 'Aktif' ? 'permission-active' : 'permission-off'}>
        <i />
        {t(c.permission)}
      </span>
      <span>{t(c.owner)}</span>
      <Icon name="chevron" size={16} />
    </button>
  );
}
