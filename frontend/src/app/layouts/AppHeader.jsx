import { ProfileMenu } from '../components/ProfileMenu.jsx';
import { Notifications } from '../components/Notifications.jsx';
import { ThemeToggle } from '../../shared/components/ThemeToggle.jsx';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.jsx';
import { useT, useLanguage } from '../../shared/i18n/useLanguage.js';

import { Icon } from '../../shared/components/Icon.jsx';
import { Badge } from '../../shared/components/Badge.jsx';

export function Header({
  page,
  account,
  photo,
  customers,
  onOpenNotification,
  onLogout,
  onProfile,
  navOpen,
  onToggleNav,
}) {
  const t = useT();
  const { language } = useLanguage();
  return (
    <header className="header">
      <div className="header-heading">
        <button
          type="button"
          className="header-menu-toggle icon-button"
          aria-label={t('Perluas sidebar')}
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          onClick={onToggleNav}
        >
          <Icon name="menu" size={22} />
        </button>
        <div className="breadcrumb">
          <span>{t('Smart Follow-up')}</span>
          <Icon name="chevron" size={14} />
          <strong>
            {t(
              language === 'en'
                ? ({
                    'Semua follow-up': 'All follow-ups',
                    Pelanggan: 'Customers',
                    Laporan: 'Reports',
                    Pengaturan: 'Settings',
                    Profil: 'Profile',
                  }[page] ?? page)
                : page,
            )}
          </strong>
        </div>
      </div>
      <div className="header-right">
        <Badge tone="demo">
          {account?.live ? 'Bintaro' : t(language === 'en' ? 'Demo mode' : 'Mode demo')}
        </Badge>
        {account && (
          <Notifications
            key={account.email}
            account={account}
            customers={customers}
            onOpen={onOpenNotification}
          />
        )}
        <div className="account-actions">
          <div className="header-preferences">
            <LanguageSwitcher />
            <span aria-hidden="true" />
            <ThemeToggle />
          </div>
          <span className="theme-divider" aria-hidden="true" />
          <ProfileMenu photo={photo} account={account} onProfile={onProfile} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
