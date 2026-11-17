import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';

/** Katalog paket yang ditawarkan, dimuat sekali per kunjungan halaman. */
export function usePackageCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/packages')
      .then((data) => active && setCatalog(data.packages))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  return { catalog, error };
}

/** Paket yang berakhir dalam `days` hari dan masih punya sisa sesi. */
export function useExpiringPackages(days) {
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setPackages(null);
    setError('');
    return api('/packages/expiring?days=' + days)
      .then((data) => setPackages(data.packages))
      .catch((e) => setError(e.message));
  }, [days]);

  useEffect(() => {
    let active = true;
    api('/packages/expiring?days=' + days)
      .then((data) => active && setPackages(data.packages))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [days]);

  return { packages, error, reload };
}

/** Paket milik satu pelanggan. `customerId` null berarti belum ada yang dipilih. */
export function useCustomerPackages(customerId) {
  // Hasil disimpan bersama id pemiliknya. Dengan begitu pergantian pelanggan
  // tidak perlu mengosongkan state di dalam efek, dan daftar pelanggan lama
  // tidak sempat terlihat di bawah nama pelanggan baru.
  const [result, setResult] = useState({ id: null, packages: null, error: '' });

  const load = useCallback((id) => {
    if (!id) return Promise.resolve();
    return api('/customers/' + id + '/packages')
      .then((data) => setResult({ id, packages: data.packages, error: '' }))
      .catch((e) => setResult({ id, packages: null, error: e.message }));
  }, []);

  useEffect(() => {
    if (!customerId) return undefined;
    let active = true;
    api('/customers/' + customerId + '/packages')
      .then((data) => active && setResult({ id: customerId, packages: data.packages, error: '' }))
      .catch((e) => active && setResult({ id: customerId, packages: null, error: e.message }));
    return () => {
      active = false;
    };
  }, [customerId]);

  const current = result.id === customerId;
  return {
    packages: current ? result.packages : null,
    error: current ? result.error : '',
    reload: () => load(customerId),
  };
}
