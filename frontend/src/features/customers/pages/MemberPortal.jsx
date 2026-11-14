import { CustomerCenter } from './CustomerCenter.jsx';

export function MemberPortal({ member, preferences, onChange, onLogout }) {
  const requests = preferences.requests || [];
  const person = {
    id: 'DEMO-001',
    name: preferences.name || member.name,
    email: 'rina.customer@example.com',
    phone: preferences.phone || '+620000000001',
    contact: member.permission === 'Aktif',
    settings: preferences.settings || {},
    acknowledged_at: preferences.acknowledged_at,
    cycles: [
      { id: 'sample', package: member.package, goal: 'renewal', date: '2026-10-16T00:00:00+07:00' },
    ],
    requests,
  };
  async function commit(path, method, data) {
    if (path === 'settings') return onChange({ settings: { ...person.settings, ...data } });
    if (path === 'me')
      return onChange({ ...data, settings: { ...person.settings, ...data.settings } });
    if (path === 'acknowledge') return onChange({ acknowledged_at: new Date().toISOString() });
    if (path === 'requests') {
      if (requests.some((r) => r.kind === data.kind && r.state === 'pending'))
        throw new Error('Permintaan masih menunggu.');
      if (
        data.starts_at &&
        (Date.parse(data.starts_at) <= Date.now() ||
          Date.parse(data.ends_at) <= Date.parse(data.starts_at))
      )
        throw new Error('Periksa waktu mulai dan selesai.');
      return onChange({
        requests: [
          {
            ...data,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            state: 'pending',
          },
          ...requests,
        ],
        ...(data.kind === 'renewal' ? { requested: true } : {}),
      });
    }
    if (!path.endsWith('/cancel')) throw new Error('Tindakan demo tidak tersedia.');
    const id = path.split('/')[1];
    const target = requests.find((r) => r.id === id);
    if (!target) throw new Error('Permintaan tidak ditemukan.');
    return onChange({
      requests: requests.map((r) => (r.id === id ? { ...r, state: 'cancelled' } : r)),
      ...(target.kind === 'renewal' ? { requested: false } : {}),
    });
  }
  return (
    <CustomerCenter person={person} commit={commit} refresh={() => {}} logout={onLogout} demo />
  );
}
