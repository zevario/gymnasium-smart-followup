import ScheduleManager from '../../components/ScheduleManager';
import '../../assets/styles/spv/SPVSchedule.css';
import useI18n from '../../i18n/useI18n.js';

function SPVSchedule() {
  const { t } = useI18n();

  return (
    <div className="spv-schedule-page">
      <ScheduleManager
        title={t('Schedule / Class')}
        description={t('Kelola dan pantau jadwal aktivitas member Gymnasyum.')}
        canManage
      />
    </div>
  );
}

export default SPVSchedule;