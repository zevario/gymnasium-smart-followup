import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Button } from '../../../shared/components/Button.jsx';

export function DemoTeamPanel() {
  const t = useT();
  return (
    <section className="card settings-card">
      <div className="setting-section">
        <div className="card-head">
          <div>
            <h2>{t('Tim Gymnasyum Bintaro')}</h2>
            <p>{t('Kelola tanggung jawab dan akses staf.')}</p>
          </div>
          <Button>{t('Tambah anggota')}</Button>
        </div>
        <div className="team-list">
          {[
            ['AP', 'Alya Putri', 'alya.putri@gymnasyum.demo', 'Member Relations'],
            ['FJ', 'Fajar Nugraha', 'fajar.n@gymnasyum.demo', 'Member Relations'],
            ['NA', 'Nisa Amalia', 'nisa.a@gymnasyum.demo', 'Manager'],
            ['RK', 'Raka Kurnia', 'raka.k@gymnasyum.demo', 'Admin'],
          ].map((r) => (
            <div key={r[1]}>
              <span className="customer-main">
                <Avatar initials={r[0]} />
                <span>
                  <strong>{t(r[1])}</strong>
                  <small>{t(r[2])}</small>
                </span>
              </span>
              <Badge tone="neutral">{t(r[3])}</Badge>
              <Button variant="ghost">{t('Kelola')}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
