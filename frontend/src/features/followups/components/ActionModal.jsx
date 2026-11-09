import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';
import { ModalShell } from '../../../shared/components/ModalShell.jsx';

export function ActionModal({ title, close, submit, onSubmit, children }) {
  const t = useT();
  return (
    <ModalShell title={t(title)} close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="modal-body form-stack">{t(children)}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            {t('Batal ')}
          </Button>
          <Button type="submit">{t(submit)}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
