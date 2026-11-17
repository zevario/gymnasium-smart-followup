import { useT } from '../../../shared/i18n/useLanguage.js';
import { useCustomerSearch } from '../hooks/useCustomerSearch.js';

/** Pemilih pelanggan untuk melihat paketnya. */
export function CustomerPicker({ search, setSearch, selectedId, onSelect }) {
  const t = useT();
  const { customers, error } = useCustomerSearch(search);

  return (
    <section className="card package-panel package-picker">
      <h2>{t('Pelanggan')}</h2>
      <label htmlFor="package-customer-search">{t('Cari nama, email, atau nomor')}</label>
      <input
        id="package-customer-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('Ketik untuk mencari')}
      />
      {error && <p role="alert">{error}</p>}
      {!customers && !error && <p role="status">{t('Memuat pelanggan…')}</p>}
      {customers &&
        (customers.length ? (
          <ul className="package-customer-list">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  aria-current={customer.id === selectedId ? 'true' : undefined}
                  className={customer.id === selectedId ? 'active' : ''}
                  onClick={() => onSelect(customer)}
                >
                  <strong>{customer.name}</strong>
                  {customer.phone && <small>{customer.phone}</small>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="package-empty">
            {t(
              search.trim()
                ? 'Tidak ada pelanggan yang cocok. Coba nama, email, atau nomor lain.'
                : 'Belum ada pelanggan aktif.',
            )}
          </p>
        ))}
    </section>
  );
}
