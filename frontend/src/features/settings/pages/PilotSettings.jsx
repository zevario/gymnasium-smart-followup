import { PilotImportForm } from '../components/PilotImportForm.jsx';
import { PilotPolicyForm } from '../components/PilotPolicyForm.jsx';
import { PilotContactRules } from '../components/PilotContactRules.jsx';
import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';

import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotSettings({ supervisor, refresh }) {
  const t = useT(),
    [body, setBody] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState(null),
    [reason, setReason] = useState(''),
    [policyError, setPolicyError] = useState('');
  useEffect(() => {
    api('/pilot/policy')
      .then(setPolicy)
      .catch((e) => setPolicyError(e.message));
  }, []);
  function example() {
    const now = Date.now();
    const base = {
      location: 'bintaro',
      consent: 'unknown',
      complaint: false,
      transaction: null,
      observedAt: new Date(now).toISOString(),
      cycleId: 'contoh-01',
      phone: '',
    };
    setBody(
      JSON.stringify(
        {
          records: [
            {
              ...base,
              customerId: 'contoh-trial',
              name: 'Contoh Trial',
              goal: 'trial',
              package: 'Trial Bintaro',
              anchor: new Date(now - 25 * 3600000).toISOString(),
            },
            {
              ...base,
              customerId: 'contoh-renewal',
              name: 'Contoh Renewal',
              goal: 'renewal',
              membershipState: 'renewable',
              package: 'Open Gym',
              anchor: new Date(now + 2 * 86400000).toISOString(),
            },
          ],
        },
        null,
        2,
      ),
    );
  }
  return (
    <>
      <PageIntro
        eyebrow="BINTARO"
        title={t('Pengaturan')}
        subtitle={t('Aturan kontak dan sumber data operasional')}
      />
      <PilotContactRules />
      {policy && (
        <PilotPolicyForm
          setBusy={setBusy}
          policy={policy}
          reason={reason}
          setPolicy={setPolicy}
          setReason={setReason}
          setPolicyError={setPolicyError}
          supervisor={supervisor}
          busy={busy}
        />
      )}
      {policyError && <p role="alert">{policyError}</p>}
      {supervisor && (
        <PilotImportForm
          setBusy={setBusy}
          setMessage={setMessage}
          body={body}
          refresh={refresh}
          setBody={setBody}
          example={example}
          busy={busy}
          message={message}
        />
      )}
    </>
  );
}
