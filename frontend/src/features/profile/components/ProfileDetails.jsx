import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function ProfileDetails({ user, saveMessage, saveFailed, saveAccountData }) {
  const t = useT();
  return (
    <div className="account-profile-details">
      <h3>{t('Informasi pribadi')}</h3>
      <dl>
        <div>
          <dt>{t('Nama lengkap')}</dt>
          <dd>{t(user.name)}</dd>
        </div>
        <div>
          <dt>{t('Email')}</dt>
          <dd>{t(user.email)}</dd>
        </div>
        <div>
          <dt>{t('Peran')}</dt>
          <dd>{t(user.role)}</dd>
        </div>
        <div>
          <dt>{t('Lokasi')}</dt>
          <dd>{t('Gymnasyum Bintaro')}</dd>
        </div>
      </dl>
      <div className="account-profile-footer">
        <div>
          <p className="account-profile-note">
            {t('Anda menggunakan profil demo untuk mencoba Smart Follow-up.')}
          </p>
          {saveMessage && (
            <p
              className={saveFailed ? 'account-save-error' : 'account-save-success'}
              role={saveFailed ? 'alert' : 'status'}
            >
              {t(saveMessage)}
            </p>
          )}
        </div>
        <Button onClick={saveAccountData}>{t('Simpan Data Akun')}</Button>
      </div>
    </div>
  );
}
