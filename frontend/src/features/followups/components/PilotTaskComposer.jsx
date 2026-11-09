import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function PilotTaskComposer({
  task,
  busy,
  draft,
  displayedDraft,
  onGenerate,
  onDraftChange,
  onReview,
}) {
  const t = useT();
  return (
    <>
      <section className="composer pilot-form">
        <h3>{t('Draft pesan')}</h3>
        <Button disabled={busy} onClick={() => onGenerate()}>
          {t(draft ? 'Buat ulang' : 'Buat draft pesan')}
        </Button>
        {task.draft && (
          <>
            <label>
              {t('Pesan untuk pelanggan')} · {task.draftKind}
              <textarea
                value={displayedDraft}
                maxLength={500}
                onChange={(e) => {
                  onDraftChange(e.target.value);
                }}
              />
            </label>
            <p>{t('Pengiriman manual tersedia pukul 09.00–18.00 WIB.')}</p>
            <Button
              disabled={busy || !displayedDraft.trim() || !task.inHours}
              onClick={() => {
                onReview();
              }}
            >
              {t('Tinjau pesan')}
            </Button>
          </>
        )}
      </section>
    </>
  );
}
