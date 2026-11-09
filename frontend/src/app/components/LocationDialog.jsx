import { LocationDetails } from './LocationDetails.jsx';

import { useT } from '../../shared/i18n/useLanguage.js';
import { useRef, useEffect } from 'react';
import { Icon } from '../../shared/components/Icon.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { permissions } from '../../features/auth/services/access.js';

export function LocationDialog({ user, memberCount, followupCount, close, onNavigate }) {
  const t = useT();
  const dialogRef = useRef(null);
  const system = permissions(user).system;
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      id="location-dialog"
      className="location-dialog"
      aria-labelledby="location-dialog-title"
      aria-describedby="location-dialog-description"
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation();
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close();
      }}
    >
      <div className="location-dialog-header">
        <div>
          <span className="location-eyebrow">{t('RUANG KERJA ANDA')}</span>
          <h2 id="location-dialog-title">{t('Lokasi aktif')}</h2>
        </div>
        <button
          type="button"
          className="location-dialog-close"
          onClick={close}
          aria-label={t('Tutup informasi lokasi')}
          autoFocus
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <LocationDetails
        user={user}
        system={system}
        memberCount={memberCount}
        followupCount={followupCount}
      />
      <div className="location-dialog-footer">
        <Button variant="secondary" onClick={close}>
          {t('Tutup')}
        </Button>
        <Button onClick={onNavigate}>
          {t(system ? 'Kelola akun' : 'Lihat member')}
          <Icon name="chevron" size={15} />
        </Button>
      </div>
    </dialog>
  );
}
