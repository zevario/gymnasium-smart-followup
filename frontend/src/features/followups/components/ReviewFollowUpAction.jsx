import { ReviewModal } from './ReviewModal.jsx';

import { canContact, followupDelay } from '../services/followupRules.js';

export function ReviewFollowUpAction({ c, draft, setModal, ownTask, update, notify }) {
  return (
    <ReviewModal
      customer={c}
      draft={draft}
      close={() => setModal(null)}
      send={() => {
        if (!ownTask || !canContact(c)) return;
        update(c.id, {
          status: 'Menunggu balasan',
          lastContact: '14 Okt 2026 · 10.00 WIB',
          nextEligible: `${14 + followupDelay()} Okt 2026 · 10.00 WIB`,
          history: [
            `14 Okt · 10.00 WIB — Simulasi pesan ditinjau dan dikirim oleh ${c.owner}. Menunggu balasan; jeda kontak hingga ${14 + followupDelay()} Okt · 10.00 WIB.`,
            ...(c.history ?? []),
          ],
        });
        setModal(null);
        notify('Simulasi terkirim. Tidak ada pesan sungguhan yang dikirim.');
      }}
    />
  );
}
