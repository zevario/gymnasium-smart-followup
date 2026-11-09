export function followupDelay() {
  try {
    const days = Number(localStorage.getItem('gymnasyum-followup-days'));
    return days >= 3 && days <= 7 ? days : 3;
  } catch {
    return 3;
  }
}

export function canContact(c) {
  return (
    c.status === 'Perlu ditinjau' && c.permission === 'Aktif' && !c.blockReason && !c.nextEligible
  );
}

export function todayQueue(customers) {
  return customers
    .filter((c) => canContact(c) && c.deadline.startsWith('Hari ini'))
    .sort((a, b) => b.score - a.score || a.deadline.localeCompare(b.deadline));
}

export function priorityLabel(score) {
  return score >= 70 ? 'Tinggi' : score >= 40 ? 'Sedang' : 'Rendah';
}
