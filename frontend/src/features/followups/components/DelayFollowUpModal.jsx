import { ActionModal } from './ActionModal.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function DelayFollowUpModal({ setModal, update, c, delayDate, notify, setDelayDate }) {
  const t = useT();
  return (
    <ActionModal
      title={t('Tunda follow-up')}
      close={() => setModal(null)}
      submit="Simpan penundaan"
      onSubmit={() => {
        update(c.id, {
          status: 'Ditunda',
          deadline: new Date(delayDate).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          history: [`Ditunda hingga ${delayDate.replace('T', ' ')}`, ...(c.history ?? [])],
        });
        setModal(null);
        notify('Penundaan tersimpan sesuai waktu pilihan');
      }}
    >
      <label>
        {t('Tanggal dan waktu ')}
        <input
          type="datetime-local"
          required
          min="2026-10-14T10:01"
          value={delayDate}
          onChange={(e) => setDelayDate(e.target.value)}
        />
      </label>
      <label>
        {t('Alasan penundaan ')}
        <textarea required placeholder={t('Tuliskan alasan untuk tim')} rows={3} />
      </label>
    </ActionModal>
  );
}
