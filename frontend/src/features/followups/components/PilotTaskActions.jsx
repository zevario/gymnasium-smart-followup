import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function PilotTaskActions({ task, edit, closed, supervisor, busy, choose }) {
  const t = useT();
  return (
    <>
      {task.pending && edit && (
        <div className="pilot-actions">
          <Button disabled={busy} onClick={() => choose('accepted')}>
            {t('Konfirmasi sudah terkirim')}
          </Button>
          <Button disabled={busy} variant="secondary" onClick={() => choose('failed')}>
            {t('Konfirmasi gagal')}
          </Button>
        </div>
      )}
      <div className="pilot-actions">
        {edit && !closed && !task.pending && (
          <>
            <Button disabled={busy} variant="secondary" onClick={() => choose('snooze')}>
              {t('Tunda')}
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => choose('reply')}>
              {t('Catat balasan')}
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => choose('outcome')}>
              {t('Catat hasil')}
            </Button>
          </>
        )}
        {supervisor && (
          <Button disabled={busy} variant="secondary" onClick={() => choose('assign')}>
            {t('Alihkan PIC')}
          </Button>
        )}
        {task.permission === 'Aktif' && (
          <Button disabled={busy} variant="secondary" onClick={() => choose('optout')}>
            {t('Catat opt-out')}
          </Button>
        )}
      </div>
    </>
  );
}
