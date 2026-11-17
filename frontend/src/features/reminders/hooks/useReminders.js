import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';

/** Daftar pengingat sesuai penyaring, dimuat ulang saat penyaringnya berubah. */
export function useReminders(filters) {
  const [reminders, setReminders] = useState(null);
  const [error, setError] = useState('');
  const { priority, status, search } = filters;

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const query = new URLSearchParams();
      if (priority) query.set('priority', priority);
      if (status) query.set('status', status);
      if (search.trim()) query.set('search', search.trim());
      const suffix = query.toString();
      api('/reminders' + (suffix ? '?' + suffix : ''))
        .then((data) => active && setReminders(data.reminders))
        .catch((e) => active && setError(e.message));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [priority, status, search]);

  return { reminders, error };
}
