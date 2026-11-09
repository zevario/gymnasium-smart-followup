import { reportRecords } from '../data/reportRecords.js';
import { StaffActivityTable } from '../components/StaffActivityTable.jsx';
import { DailyDeliveryChart } from '../components/DailyDeliveryChart.jsx';
import { FollowUpFunnel } from '../components/FollowUpFunnel.jsx';
import { ReportStats } from '../components/ReportStats.jsx';
import { ReportFilters } from '../components/ReportFilters.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useContext, useState } from 'react';
import { AccountContext } from '../../auth/context/AccountContext.js';
import { permissions } from '../../auth/services/access.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

export function Reports() {
  const t = useT();
  const user = useContext(AccountContext);
  const { supervisor } = permissions(user);
  const [range, setRange] = useState('7 hari terakhir');
  const [goal, setGoal] = useState('Perpanjangan');
  const records = reportRecords.filter(
    (r) =>
      (supervisor || r.owner === user?.name) &&
      r.goal === goal &&
      r.day >= (range === '7 hari terakhir' ? 8 : -15),
  );
  const stages = [
    'Dihubungi',
    'Terkirim',
    'Dibaca',
    'Membalas',
    'Tertarik',
    'Pembelian terverifikasi',
  ];
  const totals = stages.map((_, i) => records.filter((r) => r.stage >= i).length);
  const days = Array.from(
    { length: range === '7 hari terakhir' ? 7 : 30 },
    (_, i) => 14 - i,
  ).reverse();
  const daily = days.map((day) => records.filter((r) => r.day === day && r.stage >= 1).length);
  return (
    <>
      <PageIntro
        eyebrow={supervisor ? 'LAPORAN TIM · DATA DEMO' : 'AKTIVITAS SAYA · DATA DEMO'}
        title={t('Ringkasan follow-up')}
        subtitle="Pantau progres follow-up dan hasil konversi member."
        right={<ReportFilters goal={goal} setGoal={setGoal} range={range} setRange={setRange} />}
      />
      <ReportStats totals={totals} goal={goal} range={range} />
      <div className="report-grid">
        <FollowUpFunnel goal={goal} range={range} stages={stages} totals={totals} />
        <DailyDeliveryChart goal={goal} totals={totals} days={days} daily={daily} />
      </div>
      <StaffActivityTable
        goal={goal}
        range={range}
        supervisor={supervisor}
        user={user}
        records={records}
      />
    </>
  );
}
