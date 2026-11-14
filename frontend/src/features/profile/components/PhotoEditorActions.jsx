import { useState } from 'react';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PhotoEditorActions({ close, busy, draft, photo, onSave, setError, tab }) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  return (
    <div className="modal-actions">
      <button className="btn btn-secondary" type="button" disabled={saving} onClick={close}>
        {t('Batal')}
      </button>
      <button
        className="btn btn-primary"
        type="button"
        disabled={saving || busy || !draft || draft === photo}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(draft);
            close();
          } catch {
            setError(
              'Foto belum tersimpan. Penyimpanan browser mungkin penuh atau tidak tersedia. Coba foto lain.',
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        {t(tab === 'avatar' ? 'Pilih Avatar' : 'Simpan foto')}
      </button>
    </div>
  );
}
