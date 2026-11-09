import { useT } from '../../../shared/i18n/useLanguage.js';

export function ProfileTabs({ profileTab, setProfileTab }) {
  const t = useT();
  return (
    <div className="profile-tabs" role="tablist" aria-label={t('Pengaturan akun')}>
      {['profile', 'security'].map((tab, index) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`account-tab-${tab}`}
          aria-selected={profileTab === tab}
          aria-controls={`account-panel-${tab}`}
          tabIndex={profileTab === tab ? 0 : -1}
          onClick={() => setProfileTab(tab)}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 'profile'
                : event.key === 'End'
                  ? 'security'
                  : index === 0
                    ? 'security'
                    : 'profile';
            setProfileTab(next);
            document.getElementById(`account-tab-${next}`)?.focus();
          }}
        >
          {t(tab === 'profile' ? 'Profil' : 'Keamanan')}
        </button>
      ))}
    </div>
  );
}
