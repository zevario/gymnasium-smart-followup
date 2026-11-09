import { roles } from '../../../shared/api/pilotApi.js';

import { Button } from '../../../shared/components/Button.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotAccountRow({ row, user, busy, save }) {
  const t = useT();
  return (
    <div className="pilot-account" key={row.id}>
      <div>
        <strong>{row.name}</strong>
        <p>{row.email}</p>
      </div>
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
