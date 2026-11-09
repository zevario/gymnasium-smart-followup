import { useT } from '../../../shared/i18n/useLanguage.js';

export function PhotoEditorActions({ close, busy, draft, photo, onSave, setError, tab }) {
  const t = useT();
  return (
    <div className="modal-actions">
      <button className="btn btn-secondary" type="button" onClick={close}>
        {t('Batal')}
      </button>
      <button
        className="btn btn-primary"
        type="button"
        disabled={busy || !draft || draft === photo}
        onClick={() => {
          try {
            onSave(draft);
            close();
          } catch {
            setError(
              'Foto belum tersimpan. Penyimpanan browser mungkin penuh atau tidak tersedia. Coba foto lain.',
            );
          }
        }}
      >
        {t(tab === 'avatar' ? 'Pilih Avatar' : 'Simpan foto')}
      </button>
    </div>
  );
}
