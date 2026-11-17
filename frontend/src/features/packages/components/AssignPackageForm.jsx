import { useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { categoryLabels, formatPrice } from '../services/packageFormat.js';

/**
 * Memberikan paket dari katalog kepada pelanggan. Hanya administrator dan
 * supervisor yang boleh, sesuai pembatasan di API.
 */
export function AssignPackageForm({ customerId, catalog, onAssigned }) {
  const t = useT();
  const [packageId, setPackageId] = useState('');
  const [purchasedAt, setPurchasedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!packageId || saving) return;
    setSaving(true);
    setError('');
    setDone('');
    try {
      const body = { package_id: packageId };
      if (purchasedAt) body.purchased_at = purchasedAt;
      const data = await api('/customers/' + customerId + '/packages', 'POST', body);
      setDone(t('Paket ' + data.customerPackage.packageName + ' berhasil diberikan.'));
      setPackageId('');
      setPurchasedAt('');
      await onAssigned();
    } catch (e) {
      setError(e.status === 403 ? t('Peran Anda tidak boleh memberikan paket.') : e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card pilot-form package-assign" onSubmit={submit}>
      <h3>{t('Berikan paket')}</h3>
      <label htmlFor="package-choice">{t('Paket')}</label>
      <select
        id="package-choice"
        value={packageId}
        onChange={(event) => setPackageId(event.target.value)}
        required
      >
        <option value="">{t('Pilih paket')}</option>
        {catalog.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name +
              ' · ' +
              t(categoryLabels[item.category] || item.category) +
              ' · ' +
              formatPrice(item.price)}
          </option>
        ))}
      </select>
      <label htmlFor="package-purchased">{t('Tanggal pembelian')}</label>
      <input
        id="package-purchased"
        type="date"
        value={purchasedAt}
        onChange={(event) => setPurchasedAt(event.target.value)}
      />
      <p className="package-hint">
        {t('Dikosongkan berarti hari ini. Paket trial berlaku sejak tanggal ini,')}{' '}
        {t('paket lain berlaku sejak sesi pertama dipakai.')}
      </p>
      {error && <p role="alert">{error}</p>}
      {done && <p role="status">{done}</p>}
      <button type="submit" disabled={saving || !packageId}>
        {saving ? t('Menyimpan…') : t('Simpan')}
      </button>
    </form>
  );
}
