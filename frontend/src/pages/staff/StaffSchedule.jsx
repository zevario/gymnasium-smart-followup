import ScheduleManager from '../../components/ScheduleManager';
import '../../assets/styles/staff/StaffSchedule.css';
import useI18n from '../../i18n/useI18n.js';

function StaffSchedule() {
  const { t } = useI18n();

  return (
    <div className="staff-schedule-page">
      <ScheduleManager
        title={t('Schedule / Class')}
        description={t('Lihat jadwal kelas dan personal training member.')}
        canManage={false}
      />
    </div>
  );
}

export default StaffSchedule;