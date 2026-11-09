import { useT } from '../../../shared/i18n/useLanguage.js';

import { accountRoles } from '../../auth/services/demoAccounts.js';

import { Button } from '../../../shared/components/Button.jsx';

export function DemoAccountForm({ draft, setMessage, accounts, saveAccounts, setDraft }) {
  const t = useT();
  return (
    <form
      className="account-create-form"
      onSubmit={(event) => {
        event.preventDefault();
        const name = draft.name.trim();
        const email = draft.email.trim().toLowerCase();
        if (!name) {
          setMessage('Nama lengkap wajib diisi.');
          return;
        }
        if (accounts.some((member) => member.email === email)) {
          setMessage('Email sudah digunakan oleh akun lain.');
          return;
        }
        if (
          saveAccounts([
            ...accounts,
            {
              name,
              email,
              role: draft.role,
              initials: name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase(),
            },
          ])
        )
          setDraft({ name: '', email: '', role: accountRoles[0] });
      }}
    >
      <label>
        {t('Nama lengkap')}
        <input
          required
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label>
        {t('Email')}
        <input
          required
          type="email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        />
      </label>
      <label>
        {t('Peran')}
        <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
          {accountRoles.map((role) => (
            <option key={role} value={role}>
              {t(role)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit">{t('Buat akun')}</Button>
    </form>
  );
}
