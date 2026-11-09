import { ResultModal } from './ResultModal.jsx';

export function RecordFollowUpAction({ setModal, update, c, notify }) {
  return (
    <ResultModal
      close={() => setModal(null)}
      onSubmit={(result, transaction) => {
        const optout = result === 'Minta berhenti dihubungi';
        update(c.id, {
          transaction,
          history: [
            `14 Okt — Hasil: ${result}${transaction ? ` · Transaksi ${transaction}` : ''}`,
            ...(c.history ?? []),
          ],
          status: optout ? 'Diblokir' : 'Selesai',
          permission: optout ? 'Ditarik' : c.permission,
          blockReason: optout
            ? 'Member meminta berhenti dihubungi. Pengiriman selanjutnya dinonaktifkan.'
            : c.blockReason,
        });
        setModal(null);
        notify('Hasil follow-up berhasil dicatat');
      }}
    />
  );
}
