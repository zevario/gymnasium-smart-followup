import { ProfileDetails } from './ProfileDetails.jsx';
import { ProfileIdentity } from './ProfileIdentity.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

import { Icon } from '../../../shared/components/Icon.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';

export function ProfileCard({
  user,
  photo,
  setEditingPhoto,
  saveMessage,
  saveFailed,
  saveAccountData,
}) {
  const t = useT();
  return (
    <section className="card account-profile" aria-label={t(`Profil ${user.name}`)}>
      <div className="profile-card-heading">
        <span className="profile-card-icon">
          <Icon name="users" size={22} />
        </span>
        <div>
          <h2>{t('Informasi akun &amp; profil')}</h2>
          <p>{t('Kelola foto profil dan lihat informasi akun Anda.')}</p>
        </div>
        <Badge tone="demo">{t('Akun demo')}</Badge>
      </div>
      <ProfileIdentity photo={photo} user={user} setEditingPhoto={setEditingPhoto} />
      <ProfileDetails
        user={user}
        saveMessage={saveMessage}
        saveFailed={saveFailed}
        saveAccountData={saveAccountData}
      />
    </section>
  );
}
