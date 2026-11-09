import { api } from '../../../shared/api/pilotApi.js';
import { Button } from '../../../shared/components/Button.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotPolicyForm({
  setBusy,
  policy,
  reason,
  setPolicy,
  setReason,
  setPolicyError,
  supervisor,
  busy,
}) {
  const t = useT();
  return (
    <form
      className="card pilot-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const updated = await api('/pilot/policy', 'PUT', {
            paused: !policy.paused,
            note: reason,
          });
          setPolicy(updated);
          setReason('');
          setPolicyError('');
        } catch (err) {
          setPolicyError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <strong>{t(policy.paused ? 'Pengiriman dijeda' : 'Pengiriman manual aktif')}</strong>
      {supervisor && (
        <>
          <label>
            {t('Alasan perubahan')}
            <input
              required
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            {t(policy.paused ? 'Aktifkan pengiriman' : 'Jeda pengiriman')}
          </Button>
        </>
      )}
    </form>
  );
}
