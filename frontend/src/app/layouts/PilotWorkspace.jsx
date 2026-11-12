import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api/pilotApi.js';
import { displayUser } from '../../shared/api/users.js';
import { DESKTOP_MIN_WIDTH, isDesktopViewport } from '../../shared/utils/viewport.js';
import { Header } from './AppHeader.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Today } from '../../features/dashboard/pages/Dashboard.jsx';
import { AllFollowups } from '../../features/followups/pages/FollowUps.jsx';
import { PilotReports } from '../../features/reports/pages/PilotReports.jsx';
import { PilotSettings } from '../../features/settings/pages/PilotSettings.jsx';
import { PilotProfile } from '../../features/profile/pages/PilotProfile.jsx';
import { PilotCustomers } from '../../features/customers/pages/PilotCustomers.jsx';
import { PilotAccounts } from '../../features/accounts/pages/PilotAccounts.jsx';
import { PilotTask } from '../../features/followups/components/PilotTask.jsx';
import { defaultProfilePhoto } from '../../features/profile/utils/profilePhoto.js';
import { useT } from '../../shared/i18n/useLanguage.js';
import '../../shared/styles/pilot.css';

export function PilotWorkspace({ identity, onLogout }) {
  const t = useT(),
    user = displayUser(identity);
  const admin = identity.role === 'admin',
    supervisor = identity.role === 'spv';
  const [page, setPage] = useState(admin ? 'Pengaturan' : 'Dashboard');
  const [rows, setRows] = useState(null),
    [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null),
    [error, setError] = useState('');
  const [nav, setNav] = useState(isDesktopViewport);
  const refresh = useCallback(async () => {
    const next = await api('/pilot/tasks');
    setRows(next);
    setError('');
    return next;
  }, []);
  useEffect(() => {
    if (admin) return;
    const reload = () => refresh().catch((e) => setError(e.message));
    reload();
    if (supervisor)
      api('/pilot/assignees')
        .then(setPeople)
        .catch((e) => setError(e.message));
    const timer = setInterval(reload, 60000);
    return () => clearInterval(timer);
  }, [refresh, admin, supervisor]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const task = rows?.find((r) => r.id === selected);
  function navigate(next) {
    setPage(next);
    setSelected(null);
    if (innerWidth < DESKTOP_MIN_WIDTH) setNav(false);
  }
  const open = (row) => setSelected(row.id);
  return (
    <div className={'app-shell ' + (nav ? 'sidebar-visible' : 'sidebar-hidden')}>
      <Sidebar
        page={page}
        navigate={navigate}
        open={nav}
        onToggle={() => setNav(!nav)}
        count={rows?.filter((r) => r.canPrepare).length || 0}
        memberCount={new Set(rows?.map((r) => r.personId)).size}
        user={user}
        onLogout={onLogout}
      />
      {nav && (
        <button
          className="nav-backdrop"
          aria-label={t('Tutup navigasi')}
          onClick={() => setNav(false)}
        />
      )}
      <main className="main">
        <Header
          page={page}
          account={user}
          photo={defaultProfilePhoto}
          customers={rows || []}
          onProfile={() => navigate('Profil')}
          onOpenNotification={open}
          onLogout={onLogout}
        />
        <div className="content">
          {error && (
            <p className="card pilot-form" role="alert">
              {error}
              <button onClick={() => refresh().catch((e) => setError(e.message))}>
                {t('Coba lagi')}
              </button>
            </p>
          )}
          {page === 'Profil' ? (
            <PilotProfile user={user} />
          ) : admin ? (
            <PilotAccounts user={user} />
          ) : (
            <>
              {page === 'Pengaturan' && <PilotSettings supervisor={supervisor} refresh={refresh} />}
              {page === 'Laporan' && supervisor && <PilotReports />}
              {rows === null && !error && <p role="status">{t('Memuat antrean…')}</p>}
              {rows && page === 'Dashboard' && (
                <Today
                  customers={rows}
                  onOpen={open}
                  onAll={() => navigate('Semua follow-up')}
                  live
                />
              )}
              {rows && page === 'Semua follow-up' && (
                <AllFollowups customers={rows} onOpen={open} live />
              )}
              {rows && page === 'Pelanggan' && <PilotCustomers rows={rows} open={open} />}
            </>
          )}
        </div>
      </main>
      {task && (
        <PilotTask
          key={task.id}
          task={task}
          user={user}
          people={people}
          refresh={refresh}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
