import { ProfileCard } from '../components/ProfileCard.jsx';

import { ProfileTabs } from '../components/ProfileTabs.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

import ProfilePhotoEditor from '../components/ProfilePhotoEditor.jsx';
import AccountSecurity from '../../auth/components/AccountSecurity.jsx';
import { demoPassword } from '../../auth/services/demoAccounts.js';

export function Profile({ user, photo, onSavePhoto }) {
  const t = useT();
  const [profileTab, setProfileTab] = useState('profile');
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const saveAccountData = () => {
    try {
      localStorage.setItem(
        `gymnasyum-account-v1:${user.email}`,
        JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          location: 'Gymnasyum Bintaro',
        }),
      );
      onSavePhoto(photo);
      setSaveFailed(false);
      setSaveMessage('Data akun tersimpan di browser ini.');
    } catch {
      setSaveFailed(true);
      setSaveMessage('Data belum tersimpan. Penyimpanan browser tidak tersedia atau penuh.');
    }
  };
  return (
    <>
      <PageIntro
        eyebrow="AKUN SAYA"
        title={t('Profil saya')}
        subtitle="Informasi akun dan peran Anda di Gymnasyum."
      />
      <ProfileTabs profileTab={profileTab} setProfileTab={setProfileTab} />
      <div
        role="tabpanel"
        id="account-panel-profile"
        aria-labelledby="account-tab-profile"
        hidden={profileTab !== 'profile'}
      >
        {editingPhoto && (
          <ProfilePhotoEditor
            photo={photo}
            name={user.name}
            onSave={onSavePhoto}
            onClose={() => setEditingPhoto(false)}
          />
        )}
        <ProfileCard
          user={user}
          photo={photo}
          setEditingPhoto={setEditingPhoto}
          saveMessage={saveMessage}
          saveFailed={saveFailed}
          saveAccountData={saveAccountData}
        />
      </div>
      <div
        role="tabpanel"
        id="account-panel-security"
        aria-labelledby="account-tab-security"
        hidden={profileTab !== 'security'}
      >
        {profileTab === 'security' && <AccountSecurity demoPassword={demoPassword} />}
      </div>
    </>
  );
}
