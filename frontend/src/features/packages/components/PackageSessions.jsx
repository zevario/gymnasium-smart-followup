import { useT } from '../../../shared/i18n/useLanguage.js';
import {
  categoryLabels,
  statusLabels,
  formatPeriod,
  remainingLabel,
  daysUntilExpiry,
  isExpiringSoon,
} from '../services/packageFormat.js';

/** Satu paket milik pelanggan, dengan sisa sesi sebagai angka utama. */
export function PackageSessions({ item }) {
  const t = useT();
  const soon = isExpiringSoon(item);
  const days = daysUntilExpiry(item.expiresAt);
  return (
    <li className={'package-card' + (soon ? ' package-card-soon' : '')}>
      <div className="package-card-head">
        <strong>{item.packageName}</strong>
        <span className={'package-status package-status-' + item.status}>
          {t(statusLabels[item.status] || item.status)}
        </span>
      </div>
      <p className="package-sessions">{t(remainingLabel(item))}</p>
      <p className="package-meta">
        {t(categoryLabels[item.category] || item.category)} · {t(formatPeriod(item))}
      </p>
      {soon && (
        <p className="package-warning">
          {days === 0
            ? t('Berakhir hari ini, sisa sesi masih ada.')
            : t('Berakhir dalam ' + days + ' hari, sisa sesi masih ada.')}
        </p>
      )}
    </li>
  );
}
