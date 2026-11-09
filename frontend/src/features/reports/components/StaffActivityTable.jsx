import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';

export function StaffActivityTable({ goal, range, supervisor, user, records }) {
  const t = useT();
  return (
    <section className="card staff-table">
      <div className="card-head">
        <div>
          <h2>{t('Aktivitas staf')}</h2>
          <p>
            {t(goal)} {t('· ')}
            {t(range)}
          </p>
        </div>
      </div>
      <div className="table-head">
        <span>{t('Staf')}</span>
        <span>{t('Ditugaskan')}</span>
        <span>{t('Terkirim')}</span>
        <span>{t('Balasan')}</span>
        <span>{t('Terverifikasi')}</span>
      </div>
      {['Alya Putri', 'Fajar Nugraha', 'Nisa Amalia']
        .filter((owner) => supervisor || owner === user?.name)
        .map((owner) => {
          const rows = records.filter((r) => r.owner === owner);
          return (
            <div className="staff-row" key={owner}>
              <span className="customer-main">
                <Avatar
                  initials={owner
                    .split(' ')
                    .map((x) => x[0])
                    .join('')}
                />
                <strong>{t(owner)}</strong>
              </span>
              {[
                rows.length,
                rows.filter((r) => r.stage >= 1).length,
                rows.filter((r) => r.stage >= 3).length,
                rows.filter((r) => r.stage >= 5).length,
              ].map((n, i) => (
                <span key={i}>{t(n)}</span>
              ))}
            </div>
          );
        })}
    </section>
  );
}
