import { PackageOpen } from 'lucide-react';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useCustomerPackages } from '../hooks/usePackageCatalog.js';
import { PackageSessions } from './PackageSessions.jsx';
import { AssignPackageForm } from './AssignPackageForm.jsx';

/** Paket milik satu pelanggan, beserta form pemberian paket bagi yang berhak. */
export function CustomerPackages({ customerId, customerName, catalog, mayAssign }) {
  const t = useT();
  const { packages, error, reload } = useCustomerPackages(customerId);

  if (!customerId)
    return (
      <section className="card package-panel package-selection-empty">
        <PackageOpen size={32} aria-hidden="true" />
        <h2>{t('Paket pelanggan')}</h2>
        <p>{t('Pilih pelanggan untuk melihat paketnya.')}</p>
      </section>
    );

  return (
    <section className="card package-panel">
      <h2>{t('Paket ' + customerName)}</h2>
      {error && <p role="alert">{error}</p>}
      {!packages && !error && <p role="status">{t('Memuat paket…')}</p>}
      {packages &&
        (packages.length ? (
          <ul className="package-list">
            {packages.map((item) => (
              <PackageSessions key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p>{t('Pelanggan ini belum punya paket.')}</p>
        ))}
      {mayAssign && catalog && (
        <AssignPackageForm customerId={customerId} catalog={catalog} onAssigned={reload} />
      )}
    </section>
  );
}
