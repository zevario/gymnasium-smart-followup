import { LocationDialog } from '../components/LocationDialog.jsx';
import { LocationPin } from '../../shared/components/LocationPin.jsx';
import { useT } from '../../shared/i18n/useLanguage.js';
import { useEffect, useState, useRef } from 'react';
import { Icon } from '../../shared/components/Icon.jsx';

import { permissions } from '../../features/auth/services/access.js';
import { mayOpenPage } from '../../features/auth/services/pageAccess.js';

export function Sidebar({
  page,
  navigate,
  open,
  drawerOpen,
  count,
  memberCount,
  user,
  onLogout,
  onToggle,
}) {
  const t = useT();
  const [locationOpen, setLocationOpen] = useState(false);
  const locationTrigger = useRef(null);
  const sidebarRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!drawerOpen) return;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [drawerOpen]);

  function containFocus(event) {
    if (!drawerOpen || event.key !== 'Tab') return;
    const controls = [
      ...sidebarRef.current.querySelectorAll('button, [href], [tabindex="0"]'),
    ].filter((element) => !element.disabled && element.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  const top = [
    ['Dashboard', 'dashboard'],
    ['Semua follow-up', 'list'],
    ['Pelanggan', 'users'],
    ['Laporan', 'chart'],
    ['Pengaturan', 'settings'],
  ];
  return (
    <>
      <aside
        id="app-sidebar"
        ref={sidebarRef}
        className={`sidebar ${open ? 'sidebar-open' : ''}`}
        role={drawerOpen ? 'dialog' : undefined}
        aria-modal={drawerOpen || undefined}
        aria-label={t('Smart Follow-up')}
        onKeyDown={containFocus}
      >
        <div className="brand">
          <img
            className="brand-logo"
            src="/images/gymnasyum-logo.png"
            alt={t('Logo Gymnasyum')}
            width={40}
            height={40}
          />
          <span>
            <strong>{t('gymnasyum')}</strong>
            <small>{t('MEMBER RELATIONS')}</small>
          </span>
          <button
            ref={closeRef}
            type="button"
            className="sidebar-close icon-button"
            aria-label={t('Tutup navigasi')}
            onClick={onToggle}
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <button
          type="button"
          className="location location-trigger"
          ref={locationTrigger}
          aria-label={t('Lihat lokasi aktif: Gymnasyum Bintaro')}
          aria-haspopup="dialog"
          aria-expanded={locationOpen}
          aria-controls={locationOpen ? 'location-dialog' : undefined}
          onClick={() => setLocationOpen(true)}
        >
          <span className="location-pin" aria-hidden="true">
            <LocationPin />
          </span>
          <span className="location-trigger-copy">
            <small>
              <span className="location-dot" />
              {t('Lokasi aktif')}
            </small>
            <strong>{t('Gymnasyum Bintaro')}</strong>
          </span>
          <Icon name="chevron" size={15} />
        </button>
        <nav className="nav">
          {top
            .filter(([label]) => mayOpenPage(user, label))
            .map(([label, icon]) => (
              <button
                key={label}
                title={t(label)}
                aria-label={t(label)}
                aria-current={page === label ? 'page' : undefined}
                className={page === label ? 'active' : ''}
                onClick={() => navigate(label)}
              >
                <Icon name={icon} />
                <span>{t(label)}</span>
                {label === 'Dashboard' && <i>{t(count)}</i>}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            type="button"
            className="profile sidebar-logout"
            onClick={onLogout}
            aria-label={t('Logout')}
            title={t('Logout')}
          >
            <Icon name="logout" size={22} />
            <span>{t('Logout')}</span>
          </button>
        </div>
      </aside>
      {locationOpen && (
        <LocationDialog
          user={user}
          memberCount={memberCount}
          followupCount={count}
          close={() => {
            setLocationOpen(false);
            requestAnimationFrame(() => locationTrigger.current?.focus());
          }}
          onNavigate={() => {
            setLocationOpen(false);
            navigate(permissions(user).system ? 'Pengaturan' : 'Pelanggan');
          }}
        />
      )}
      <button
        className={`sidebar-edge-toggle ${open ? 'is-expanded' : ''}`}
        onClick={onToggle}
        aria-label={t(open ? 'Perkecil sidebar' : 'Perluas sidebar')}
        title={t(open ? 'Perkecil sidebar' : 'Perluas sidebar')}
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        <Icon name="chevron" size={22} />
      </button>
    </>
  );
}
