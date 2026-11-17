import { useEffect, useId, useRef } from 'react';
import { Trash2, X, AlertTriangle, LoaderCircle } from 'lucide-react';
import { roles } from '../../../shared/api/users.js';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function DeleteAccountDialog({ account, busy, error, onClose, onConfirm }) {
  const t = useT();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="delete-account-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="delete-account-body">
        <div className="delete-account-top">
          <span className="delete-account-icon">
            <Trash2 size={25} aria-hidden="true" />
          </span>
          <button
            className="delete-account-close"
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label={t('Tutup konfirmasi')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="delete-account-eyebrow">{t('KELOLA AKUN')}</p>
        <h2 id={titleId}>{t('Hapus akun ini?')}</h2>
        <p id={descriptionId} className="delete-account-description">
          {t('Akun akan dihapus secara permanen dan tidak dapat digunakan untuk masuk kembali.')}
        </p>
        <div className="delete-account-person">
          <span className="delete-account-avatar" aria-hidden="true">
            {account.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0])
              .join('')
              .toUpperCase()}
          </span>
          <div>
            <strong>{account.name}</strong>
            <span>{account.email}</span>
            <small>{t(roles[account.role] || account.role)}</small>
          </div>
        </div>
        <div className="delete-account-warning">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>
            {t('Tindakan ini tidak dapat dibatalkan.')}
            <span>{t('Untuk menutup akses sementara, gunakan Nonaktifkan.')}</span>
          </p>
        </div>
        {error && (
          <p className="delete-account-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="delete-account-footer">
        <button
          ref={cancelRef}
          className="delete-account-cancel"
          type="button"
          autoFocus
          disabled={busy}
          onClick={onClose}
        >
          {t('Batal')}
        </button>
        <button
          className="delete-account-confirm"
          type="button"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? (
            <LoaderCircle size={17} className="delete-account-spinner" aria-hidden="true" />
          ) : (
            <Trash2 size={17} aria-hidden="true" />
          )}
          {t(busy ? 'Menghapus…' : 'Hapus akun')}
        </button>
      </div>
    </dialog>
  );
}
