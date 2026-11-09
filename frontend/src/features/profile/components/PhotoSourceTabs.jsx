import { useT } from '../../../shared/i18n/useLanguage.js';

export function PhotoSourceTabs({ tab, busy, setTab, setError, setDragging }) {
  const t = useT();
  return (
    <div className="photo-tabs" role="tablist" aria-label={t('Sumber foto profil')}>
      {['avatar', 'upload'].map((value, index) => (
        <button
          key={value}
          type="button"
          role="tab"
          id={`photo-tab-${value}`}
          aria-controls={`photo-panel-${value}`}
          aria-selected={tab === value}
          tabIndex={tab === value ? 0 : -1}
          disabled={busy}
          onClick={() => {
            setTab(value);
            setError('');
            setDragging(false);
          }}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 'avatar'
                : event.key === 'End'
                  ? 'upload'
                  : index === 0
                    ? 'upload'
                    : 'avatar';
            setTab(next);
            setError('');
            document.getElementById(`photo-tab-${next}`)?.focus();
          }}
        >
          {t(value === 'avatar' ? 'Karakter Avatar' : 'Upload Foto Sendiri')}
        </button>
      ))}
    </div>
  );
}
