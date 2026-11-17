import { roles } from '../../../shared/api/users.js';

import { Button } from '../../../shared/components/Button.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotAccountRow({ row, user, busy, save }) {
  const t = useT();
  return (
    <div className="pilot-account" key={row.id}>
      <div className="staff-account-identity">
        <strong>{row.name}</strong>
        {row.id === user.id && <span className="staff-account-self">{t('Anda')}</span>}
        <p>{row.email}</p>
      </div>
      <span className={'staff-account-status' + (row.is_active ? ' is-active' : '')}>{t(row.is_active ? 'Aktif' : 'Nonaktif')}</span>
      <select
        aria-label={t('Peran') + ' ' + row.name}
        value={row.role}
        disabled={row.id === user.id || busy}
        onChange={(e) => save('/users/' + row.id, 'PUT', { role: e.target.value })}
      >
        {Object.entries(roles).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        disabled={row.id === user.id || busy}
        onClick={() => save('/users/' + row.id, 'PUT', { is_active: !row.is_active })}
      >
        {t(row.is_active ? 'Nonaktifkan' : 'Aktifkan')}
      </Button>
    </div>
  );
}
