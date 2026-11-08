import ScheduleManager from '../../components/ScheduleManager';
import '../../assets/styles/admin/AdminSchedule.css';
import useI18n from '../../i18n/useI18n.js';

function AdminSchedule() {
  const { t } = useI18n();

  return (
    <div className="admin-schedule-page">
      <ScheduleManager
        title={t('Schedule / Class')}
        description={t('Kelola jadwal kelas dan personal training Gymnasyum.')}
        canManage
      />
    </div>
  );
}

export default AdminSchedule;
