export const HOUR = 3600000;
export const DAY = 24 * HOUR;
const offset = 7 * HOUR; // Bintaro uses UTC+7 year round.
const midnight = (time) => Math.floor((time + offset) / DAY) * DAY - offset;
export function schedule(goal, anchor, receivedAt = -Infinity) {
  const time = Date.parse(anchor);
  const opens = goal === 'trial' ? time + DAY : midnight(time) - 7 * DAY;
  const actionable = Math.max(opens, receivedAt);
  const endToday = midnight(actionable) + 18 * HOUR;
  return {
    opens,
    due: endToday - actionable >= 2 * HOUR ? endToday : endToday + DAY,
    expires: goal === 'trial' ? time + 14 * DAY : midnight(time) + 8 * DAY,
  };
}
export function evaluate(row, attempts, now = Date.now()) {
  const facts = row.facts;
  const trial = row.goal === 'trial';
  const age = (now - Date.parse(facts.anchor)) / DAY;
  const days = (midnight(Date.parse(facts.anchor)) - midnight(now)) / DAY;
  const late = now - Date.parse(row.due_at);
  let urgency = 0;
  if (trial && age >= 1 && age < 14) urgency = age <= 2 ? 40 : age <= 7 ? 30 : 15;
  if (!trial && days >= -7 && days <= 7) urgency = days < 0 ? 20 : days <= 2 ? 40 : 30;
  const parts = {
    urgency,
    interest: { payment: 30, information: 15, none: 0 }[facts.interest],
    activity: trial
      ? facts.continueTrial
        ? 20
        : 10
      : facts.visits >= 4
        ? 20
        : facts.visits > 0
          ? 10
          : 0,
    overdue: late > DAY ? 10 : late > 0 ? 5 : 0,
  };
  const accepted = attempts
    .filter((a) => a.state === 'accepted')
    .sort((a, b) => Date.parse(b.accepted_at) - Date.parse(a.accepted_at));
  const recent = accepted.filter((a) => Date.parse(a.accepted_at) > now - 7 * DAY);
  const cycle = accepted.filter((a) => a.cycle_id === row.id);
  const pending = attempts.find((a) => a.state === 'unknown');
  const last = cycle[0];
  const hour = (now - midnight(now)) / HOUR;
  let status = 'Perlu ditinjau',
    block = '';
  if (row.status === 'closed' || facts.transaction || now >= Date.parse(row.expires_at))
    status = 'Selesai';
  else if (row.opted_out_at || row.consent !== 'granted')
    block = 'Izin kontak belum tersedia atau sudah ditarik.';
  else if (!trial && facts.membershipState && facts.membershipState !== 'renewable')
    block = 'Paket tidak memenuhi syarat perpanjangan manual.';
  else if (row.complaint) block = 'Komplain pelanggan masih aktif.';
  else if (!/^\+[1-9]\d{7,14}$/.test(row.phone)) block = 'Nomor pelanggan perlu diverifikasi.';
  else if (pending) block = 'Pengiriman manual menunggu konfirmasi.';
  else if (now < Date.parse(row.opens_at)) status = 'Mendatang';
  else if (row.status === 'reply') status = 'Dalam penanganan';
  else if (row.status === 'snoozed' && now < Date.parse(row.next_at)) status = 'Ditunda';
  else if (last && now < Date.parse(last.accepted_at) + (trial ? 72 : 48) * HOUR)
    status = 'Menunggu balasan';
  else if (cycle.length >= 2) status = 'Selesai';
  else if (!trial && last && days > 2) status = 'Mendatang';
  else if (accepted[0] && now - Date.parse(accepted[0].accepted_at) < 48 * HOUR)
    block = 'Jeda lintas tujuan 48 jam masih aktif.';
  else if (recent.length >= 3 || recent.filter((a) => a.goal === row.goal).length >= 2)
    block = 'Batas kontak tujuh hari sudah tercapai.';
  if (
    !block &&
    status === 'Perlu ditinjau' &&
    now - Math.min(Date.parse(row.observed_at), Date.parse(row.person_observed)) > DAY
  )
    block = 'Snapshot sumber melewati batas 24 jam.';
  const inHours = hour >= 9 && hour < 18;
  return {
    parts,
    score: Object.values(parts).reduce((a, b) => a + b, 0),
    status: block ? 'Diblokir' : status,
    blockReason: block,
    inHours,
    contactEndsAt: midnight(now) + 18 * HOUR,
    canPrepare: !block && status === 'Perlu ditinjau',
    pending: pending?.cycle_id === row.id ? pending.id : null,
  };
}
