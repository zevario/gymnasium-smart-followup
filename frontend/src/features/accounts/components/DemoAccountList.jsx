import { useT } from '../../../shared/i18n/useLanguage.js';

import { accountRoles, roleDescriptions } from '../../auth/services/demoAccounts.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Button } from '../../../shared/components/Button.jsx';

export function DemoAccountList({ accounts, user, saveAccounts, disabledAccounts, toggleAccount }) {
  const t = useT();
  return (
    <div className="system-accounts">
      {accounts.map((member) => (
        <div key={member.email}>
          <Avatar initials={member.initials} dark />
          <div>
            <strong>{t(member.name)}</strong>
            <small>{t(member.email)}</small>
            <select
              aria-label={t(`Peran ${member.name}`)}
              disabled={member.email === user?.email}
              value={member.role}
              onChange={(event) =>
                saveAccounts(
                  accounts.map((item) =>
                    item.email === member.email ? { ...item, role: event.target.value } : item,
                  ),
                )
              }
            >
              {accountRoles.map((role) => (
                <option key={role} value={role}>
                  {t(role)}
                </option>
              ))}
            </select>
            <small>{t(roleDescriptions[member.role])}</small>
          </div>
          <Badge tone={disabledAccounts.includes(member.email) ? 'warning' : 'active'}>
            {t(disabledAccounts.includes(member.email) ? 'Nonaktif' : 'Aktif')}
          </Badge>
          <Button
            variant="secondary"
            disabled={member.email === user?.email}
            onClick={() => toggleAccount(member.email)}
          >
            {t(
              member.email === user?.email
                ? 'Akun Anda'
                : disabledAccounts.includes(member.email)
                  ? 'Aktifkan'
                  : 'Nonaktifkan',
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
