import { useT } from '../../shared/i18n/useLanguage.js';

import { Icon } from '../../shared/components/Icon.jsx';

export function NotificationPanel({
  setOpen,
  trigger,
  unread,
  items,
  markRead,
  read,
  onOpen,
  account,
}) {
  const t = useT();
  return (
    <section
      className="notification-panel"
      id="notification-panel"
      aria-label={t('Daftar notifikasi')}
    >
      <div className="notification-heading">
        <div className="notification-title">
          <span className="notification-bell">
            <Icon name="bell" size={20} />
          </span>
          <div>
            <strong>{t('Notifikasi')}</strong>
            <p>{t('Aktivitas dan pengingat Anda')}</p>
          </div>
        </div>
        <button
          className="notification-close"
          aria-label={t('Tutup notifikasi')}
          onClick={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="notification-toolbar">
        <span className="notification-count">
          {t(unread ? `${unread} belum dibaca` : 'Semua sudah dibaca')}
        </span>
        {items.length > 0 && (
          <button
            className="notification-read-all"
            disabled={!unread}
            onClick={() => markRead(items.map((item) => item.id))}
          >
            <Icon name="check" size={14} /> {t('Tandai semua')}
          </button>
        )}
      </div>
      {items.length > 0 ? (
        <>
          <div className="notification-list">
            {items.map(({ id, customer }) => (
              <button
                key={id}
                className={`notification-item ${read.includes(id) ? '' : 'is-unread'}`}
                onClick={() => {
                  markRead([id]);
                  setOpen(false);
                  onOpen(customer);
                }}
              >
                <span className="notification-avatar" aria-hidden="true">
                  {t(customer.initials)}
                </span>
                <span className="notification-copy">
                  <span className="notification-item-title">
                    <strong>{t(customer.name)}</strong>
                    {!read.includes(id) && (
                      <span className="notification-dot" aria-label={t('Belum dibaca')} />
                    )}
                  </span>
                  <span className="notification-description">
                    {t('Follow-up ')}
                    {t(customer.goal.toLowerCase())} {t('siap ditinjau.')}
                  </span>
                  <small className="notification-time">
                    <Icon name="clock" size={12} />
                    {t(customer.deadline)}
                  </small>
                  <span className="notification-item-footer">
                    <small>
                      {t('Petugas: ')}
                      {t(customer.owner)}
                    </small>
                    <span>
                      {t('Lihat detail ')}
                      <Icon name="chevron" size={12} />
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="notification-empty">
          <span className="notification-empty-icon">
            <Icon name="check" size={26} />
          </span>
          <strong>{t('Belum ada pengingat')}</strong>
          <p>{t('Tugas follow-up yang siap ditinjau akan muncul di sini.')}</p>
        </div>
      )}
      <p className="notification-footnote">
        {t(
          account.live
            ? 'Berdasarkan antrean lokasi aktif.'
            : 'Berdasarkan tugas follow-up demo yang dapat Anda akses.',
        )}
      </p>
    </section>
  );
}
