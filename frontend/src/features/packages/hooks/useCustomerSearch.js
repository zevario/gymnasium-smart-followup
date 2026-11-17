import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';

/**
 * Mencari pelanggan untuk dipilih. Pencarian ditunda sebentar agar setiap huruf
 * yang diketik tidak menjadi satu permintaan.
 */
export function useCustomerSearch(search) {
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api('/customers?status=active&limit=20&search=' + encodeURIComponent(search.trim()))
        .then((data) => active && setCustomers(data.customers))
        .catch((e) => active && setError(e.message));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return { customers, error };
}
