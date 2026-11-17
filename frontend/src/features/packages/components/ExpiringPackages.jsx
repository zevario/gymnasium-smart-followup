import { useT } from '../../../shared/i18n/useLanguage.js';
import { useExpiringPackages } from '../hooks/usePackageCatalog.js';
import { formatDate, remainingLabel } from '../services/packageFormat.js';

/** Paket yang berakhir dalam `days` hari dan masih punya sisa sesi. */
export function ExpiringPackages({ days, setDays }) {
  const t = useT();
  const { packages, error } = useExpiringPackages(days);

  return (
    <section className="card package-panel">
      <div className="package-panel-head">
        <h2>{t('Paket mendekati kedaluwarsa')}</h2>
        <label htmlFor="expiring-days">
          {t('Dalam')}{' '}
          <select
            id="expiring-days"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {[3, 7, 14, 30].map((option) => (
              <option key={option} value={option}>
                {option + ' ' + t('hari')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      {!packages && !error && <p role="status">{t('Memuat daftar…')}</p>}
      {packages &&
        (packages.length ? (
          <div
            className="package-table-scroll"
            role="region"
            aria-label={t('Paket mendekati kedaluwarsa')}
            tabIndex={0}
          >
            <table className="package-table">
              <thead>
                <tr>
                  <th scope="col">{t('Pelanggan')}</th>
                  <th scope="col">{t('Paket')}</th>
                  <th scope="col">{t('Sisa sesi')}</th>
                  <th scope="col">{t('Berakhir')}</th>
                  <th scope="col">{t('Sisa hari')}</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.customerName}
                      {item.customerPhone && <small>{item.customerPhone}</small>}
                    </td>
                    <td>{item.packageName}</td>
                    <td>{t(remainingLabel(item))}</td>
                    <td>{formatDate(item.expiresAt)}</td>
                    <td className={item.daysLeft <= 2 ? 'package-days-urgent' : ''}>
                      {item.daysLeft === 0 ? t('hari ini') : item.daysLeft + ' ' + t('hari')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="package-empty">
            <strong>{t('Tidak ada paket mendekati kedaluwarsa')}</strong>
            <p>{t('Tidak ada paket yang berakhir dalam rentang ini.')}</p>
          </div>
        ))}
    </section>
  );
}
