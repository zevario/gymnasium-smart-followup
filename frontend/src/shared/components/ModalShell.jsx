import { useT } from '../i18n/useLanguage.js';
import { Icon } from './Icon.jsx';

export function ModalShell({ title, close, children }) {
  const t = useT();
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{t(title)}</h2>
          <button onClick={close} aria-label={t('Tutup')}>
            <Icon name="close" />
          </button>
        </div>
        {t(children)}
      </div>
    </div>
  );
}
