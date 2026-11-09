import { useT } from '../../../shared/i18n/useLanguage.js';

import { Button } from '../../../shared/components/Button.jsx';

export function FollowUpCycleRules() {
  const t = useT();
  return (
    <div className="setting-section">
      <h2>{t('Siklus follow-up')}</h2>
      <p>{t('Tentukan kapan tugas dibuat dan berakhir.')}</p>
      <div className="rule-list">
        <div>
          <span className="rule-icon">{t('T')}</span>
          <strong>{t('Trial')}</strong>
          <p>
            {t('Kontak pertama ')}
            <b>{t('24 jam')}</b> {t('· kedua ')}
            <b>{t('72 jam')}</b> {t('· berakhir ')}
            <b>{t('14 hari')}</b>
          </p>
          <Button variant="ghost">{t('Ubah')}</Button>
        </div>
        <div>
          <span className="rule-icon">{t('P')}</span>
          <strong>{t('Perpanjangan')}</strong>
          <p>
            {t('Kontak pada ')}
            <b>{t('H-7')}</b> {t('dan ')}
            <b>{t('H-2')}</b> {t('· berakhir ')}
            <b>{t('H+7')}</b>
          </p>
          <Button variant="ghost">{t('Ubah')}</Button>
        </div>
      </div>
      <label className="attempts">
        {t('Maksimum percobaan per siklus')}
        {t(' ')}
        <select defaultValue="2">
          <option value={'1'}>{t('1')}</option>
          <option value={'2'}>{t('2')}</option>
          <option value={'3'}>{t('3')}</option>
        </select>
      </label>
    </div>
  );
}
