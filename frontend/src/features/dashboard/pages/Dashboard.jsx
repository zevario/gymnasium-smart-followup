import { BlockedTaskNotice } from '../components/BlockedTaskNotice.jsx';
import { TeamActivityCard } from '../components/TeamActivityCard.jsx';
import { RecommendationCard } from '../components/RecommendationCard.jsx';
import { DashboardQueue } from '../components/DashboardQueue.jsx';

import { DashboardStats } from '../components/DashboardStats.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

import { todayQueue } from '../../followups/services/followupRules.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

export function Today({ customers, onOpen, onAll, live = false }) {
  const t = useT();
  const queue = live ? customers.filter((c) => c.canPrepare) : todayQueue(customers);
  const recommendation = queue[0];
  const blockedCustomers = customers.filter((c) => c.permission !== 'Aktif' || c.blockReason);
  return (
    <>
      <PageIntro
        eyebrow="RUANG KERJA · GYMNASYUM BINTARO"
        title={t('Follow-up yang tepat, di waktu yang tepat.')}
        subtitle="Fokus pada member yang paling membutuhkan perhatian hari ini."
        right={
          <span className="freshness">
            <span className="pulse" />
            {t(live ? 'Terhubung ke server' : 'Data diperbarui 09.02 WIB ')}
          </span>
        }
      />
      <DashboardStats queue={queue} customers={customers} live={live} />
      <div className="dashboard-grid">
        <DashboardQueue customers={customers} queue={queue} onOpen={onOpen} />
        <aside className="right-column">
          <RecommendationCard recommendation={recommendation} onOpen={onOpen} />
          {!live && <TeamActivityCard onAll={onAll} />}
          <BlockedTaskNotice blockedCustomers={blockedCustomers} onOpen={onOpen} />
        </aside>
      </div>
    </>
  );
}
