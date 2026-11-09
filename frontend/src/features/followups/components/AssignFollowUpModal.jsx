import { ActionModal } from './ActionModal.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function AssignFollowUpModal({
  setModal,
  supervisor,
  assignReason,
  update,
  c,
  newOwner,
  user,
  notify,
  setNewOwner,
  setAssignReason,
}) {
  const t = useT();
  return (
    <ActionModal
      title={t('Alihkan PIC')}
      close={() => setModal(null)}
      submit="Alihkan"
      onSubmit={() => {
        if (!supervisor || !assignReason.trim()) return;
        update(c.id, {
          owner: newOwner,
          history: [
            `PIC dialihkan ke ${newOwner} oleh ${user?.name}. Alasan: ${assignReason.trim()}`,
            ...(c.history ?? []),
          ],
        });
        setModal(null);
        notify(`PIC berhasil dialihkan ke ${newOwner}`);
      }}
    >
      <label>
        {t('Pilih PIC ')}
        <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
          <option value={'Fajar'}>{t('Fajar')}</option>
          <option value={'Nisa'}>{t('Nisa')}</option>
          <option value={'Alya'}>{t('Alya')}</option>
        </select>
      </label>
      <label>
        {t('Alasan pengalihan')}
        <textarea
          required
          value={assignReason}
          onChange={(event) => setAssignReason(event.target.value)}
        />
      </label>
      <p className="modal-note">
        {t('PIC baru akan melihat tugas ini pada daftar follow-up mereka. ')}
      </p>
    </ActionModal>
  );
}
