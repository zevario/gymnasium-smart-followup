import { useT } from '../../../shared/i18n/useLanguage.js';
import { Icon } from '../../../shared/components/Icon.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';

import { Button } from '../../../shared/components/Button.jsx';

export function FollowUpComposer({
  customer: c,
  tone,
  setTone,
  draft,
  setDraft,
  loading,
  ownTask,
  generate,
  notify,
  onReview,
}) {
  const t = useT();
  return (
    <>
      <section className="composer">
        <div className="composer-head">
          <div>
            <span className="ai-icon">
              <Icon name="spark" size={17} />
            </span>
            <div>
              <h3>{t('Asisten pesan AI')}</h3>
              <p>{t('Susun draft dari fakta member yang tersedia.')}</p>
            </div>
          </div>
          {draft && (
            <>
              <Badge tone="blue">{t('Draft AI')}</Badge>
              <Badge tone="warning">{t('Perlu ditinjau')}</Badge>
            </>
          )}
        </div>
        <div className="tone-row">
          <span>{t('Nada pesan')}</span>
          <div className="segmented">
            {['Ramah', 'Ringkas', 'Formal'].map((x) => (
              <button
                className={tone === x ? 'selected' : ''}
                key={x}
                onClick={() => {
                  setTone(x);
                  if (draft) generate(x);
                }}
              >
                {t(x)}
              </button>
            ))}
          </div>
        </div>
        {!draft ? (
          <div className="draft-empty">
            <Icon name="spark" size={22} />
            <p>
              {t('Draft akan menggunakan data paket, tanggal berakhir, dan konteks interaksi. ')}
            </p>
            <Button onClick={() => generate()} disabled={loading || !ownTask}>
              {loading ? (
                <>
                  <span className="spinner" /> {t('Menyusun draft... ')}
                </>
              ) : (
                'Buat draft pesan'
              )}
            </Button>
          </div>
        ) : (
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} />
            <div className="draft-meta">
              <span>
                {t(draft.length)} {t('/ 500 karakter')}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(draft);
                  notify('Draft disalin ke papan klip');
                }}
              >
                <Icon name="copy" size={14} /> {t('Salin ')}
              </button>
            </div>
            <div className="facts">
              <small>{t('Fakta yang digunakan')}</small>
              <span>{t(c.package)}</span>
              <span>{t(c.context)}</span>
              <span>{t('Lokasi Bintaro')}</span>
            </div>
            <div className="composer-actions">
              <Button variant="secondary" onClick={() => generate()}>
                {t('Buat ulang ')}
              </Button>
              <Button onClick={() => onReview()}>{t('Tinjau pesan ')}</Button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
