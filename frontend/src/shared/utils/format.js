/** Formats an ISO timestamp in Jakarta time, e.g. "12 Nov 2026, 10.42 WIB". */
export const dateTime = (time) =>
  time
    ? new Date(time).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' WIB'
    : '—';
