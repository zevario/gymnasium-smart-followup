import { useT } from '../../../shared/i18n/useLanguage.js';
import { priorityLabels } from '../services/reminderFormat.js';

/**
 * Lencana prioritas.
 *
 * Sumbernya ikut ditampilkan karena prioritas dari model dan dari aturan
 * sederhana tidak setara, dan petugas berhak tahu mana yang sedang ia percayai.
 */
export function PriorityBadge({ priority, source }) {
  const t = useT();
  if (!priority) {
    return (
      <span className="priority-badge priority-badge-none" title={t('Belum pernah diklasifikasi')}>
        {t('Belum dinilai')}
      </span>
    );
  }
  const baseline = source !== 'model';
  return (
    <span
      className={'priority-badge priority-badge-' + priority + (baseline ? ' is-baseline' : '')}
      title={
        baseline ? t('Dari aturan sederhana, bukan model klasifikasi') : t('Dari model klasifikasi')
      }
    >
      {t(priorityLabels[priority] || priority)}
      <small>{baseline ? t('aturan') : t('model')}</small>
    </span>
  );
}
