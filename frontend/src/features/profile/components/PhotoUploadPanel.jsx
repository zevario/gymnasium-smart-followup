import { useT } from '../../../shared/i18n/useLanguage.js';

export function PhotoUploadPanel({
  tab,
  inputRef,
  selectPhoto,
  dragging,
  busy,
  setDragging,
  uploadDraft,
  name,
}) {
  const t = useT();
  return (
    <div
      role="tabpanel"
      id="photo-panel-upload"
      aria-labelledby="photo-tab-upload"
      hidden={tab !== 'upload'}
      className="photo-upload-panel"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          void selectPhoto(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <button
        type="button"
        className={`photo-dropzone ${dragging ? 'is-dragging' : ''}`}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) void selectPhoto(event.dataTransfer.files[0]);
        }}
      >
        {uploadDraft ? (
          <img
            className="photo-editor-preview"
            src={uploadDraft}
            alt={t(`Pratinjau foto ${name}`)}
            width={128}
            height={128}
          />
        ) : (
          <span className="photo-upload-icon" aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8" cy="8" r="1.5" />
              <path d="m4 19 6-6 4 4 3-7 4 9" />
            </svg>
          </span>
        )}
        <strong>
          {t(
            busy ? 'Memproses foto…' : uploadDraft ? 'Ganti foto' : 'Klik atau geser foto ke sini',
          )}
        </strong>
        <span className="photo-editor-hint">{t('JPG, JPEG, PNG, atau WEBP · Maksimal 5 MB')}</span>
        <span className="btn btn-secondary">{t('Pilih dari Perangkat')}</span>
      </button>
      {uploadDraft && (
        <p className="photo-editor-hint">
          {t('Foto dipotong dari tengah dan tersimpan di browser ini.')}
        </p>
      )}
    </div>
  );
}
