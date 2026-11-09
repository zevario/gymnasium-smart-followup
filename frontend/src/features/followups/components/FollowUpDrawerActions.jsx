import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function FollowUpDrawerActions({ setModal, blocked, ownTask, supervisor }) {
  const t = useT();
  return (
    <div className="drawer-footer">
      <Button variant="secondary" onClick={() => setModal('delay')} disabled={blocked || !ownTask}>
        {t('Tunda ')}
      </Button>
      <Button
        variant="secondary"
        disabled={!supervisor}
        onClick={() => {
          if (supervisor) setModal('assign');
        }}
      >
        {t('Alihkan PIC ')}
      </Button>
      <Button
        variant="dark"
        disabled={!ownTask}
        onClick={() => {
          if (ownTask) setModal('result');
        }}
      >
        {t('Catat hasil ')}
      </Button>
    </div>
  );
}
