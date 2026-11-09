import { DemoTeamPanel } from '../components/DemoTeamPanel.jsx';
import { ContactRulesPanel } from '../components/ContactRulesPanel.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';
import { useContext, useState } from 'react';
import { AccountContext } from '../../auth/context/AccountContext.js';
import { permissions } from '../../auth/services/access.js';
import { followupDelay } from '../../followups/services/followupRules.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

export function Settings({ notify }) {
  const t = useT();
  const user = useContext(AccountContext);
  const readOnly = !permissions(user).supervisor;
  const [tab, setTab] = useState('Aturan follow-up');
  const [delay, setDelay] = useState(followupDelay);
  return (
    <>
      <PageIntro
        eyebrow="PENGATURAN"
        title={t('Pengaturan Smart Follow-up')}
        subtitle="Sesuaikan aturan operasional dan akses tim untuk lokasi ini."
      />
      {readOnly && (
        <p className="settings-readonly-note">
          {t(
            'Pengaturan ini hanya dapat diubah oleh Supervisor. Hubungi supervisor untuk mengajukan perubahan.',
          )}
        </p>
      )}
      <fieldset disabled={readOnly} className="settings-access">
        <div className="settings-layout">
          <div className="settings-tabs">
            <button
              className={tab === 'Aturan follow-up' ? 'active' : ''}
              onClick={() => setTab('Aturan follow-up')}
            >
              {t('Aturan follow-up ')}
            </button>
            <button
              disabled
              title={t('Pengelolaan akun tersedia untuk Administrator Sistem')}
              className={tab === 'Tim & peran' ? 'active' : ''}
              onClick={() => setTab('Tim & peran')}
            >
              {t('Tim & peran ')}
            </button>
          </div>
          {tab === 'Aturan follow-up' ? (
            <ContactRulesPanel
              delay={delay}
              setDelay={setDelay}
              readOnly={readOnly}
              notify={notify}
            />
          ) : (
            <DemoTeamPanel />
          )}
        </div>
      </fieldset>
    </>
  );
}
