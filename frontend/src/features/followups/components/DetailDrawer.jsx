import { RecordFollowUpAction } from './RecordFollowUpAction.jsx';
import { ReviewFollowUpAction } from './ReviewFollowUpAction.jsx';
import { AssignFollowUpModal } from './AssignFollowUpModal.jsx';
import { DelayFollowUpModal } from './DelayFollowUpModal.jsx';
import { FollowUpDrawerActions } from './FollowUpDrawerActions.jsx';
import { FollowUpContact } from './FollowUpContact.jsx';
import { FollowUpIdentity } from './FollowUpIdentity.jsx';
import { FollowUpSummary } from './FollowUpSummary.jsx';
import { FollowUpComposer } from './FollowUpComposer.jsx';
import { useDemoDraft } from '../hooks/useDemoDraft.js';

import { History } from './History.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useContext, useState } from 'react';
import { AccountContext } from '../../auth/context/AccountContext.js';
import { permissions, mayEditTask } from '../../auth/services/access.js';
import { canContact } from '../services/followupRules.js';
import { Icon } from '../../../shared/components/Icon.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';

import { Button } from '../../../shared/components/Button.jsx';

export function DetailDrawer({ customer: c, onClose, update, notify }) {
  const t = useT();
  const user = useContext(AccountContext);
  const { supervisor } = permissions(user);
  const ownTask = mayEditTask(user, c.owner);
  const { tone, setTone, draft, setDraft, loading, generate } = useDemoDraft(c, user, ownTask);
  const canClaim = c.owner === 'Belum ditugaskan' && permissions(user).operational;
  const [assignReason, setAssignReason] = useState('');
  const [tab, setTab] = useState('Ringkasan');
  const [modal, setModal] = useState(null);
  const [delayDate, setDelayDate] = useState('2026-10-16T10:00');
  const [newOwner, setNewOwner] = useState('Fajar');
  const eligible = canContact(c);
  const blocked = c.status === 'Diblokir' || c.permission !== 'Aktif' || Boolean(c.blockReason);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t(`Detail ${c.name}`)}
      >
        <div className="drawer-header">
          <button className="back-button" onClick={onClose}>
            <Icon name="arrow" /> {t('Kembali ')}
          </button>
          <div>
            <Badge tone={blocked ? 'warning' : 'active'}>{t(c.status)}</Badge>
            <button className="icon-button" onClick={onClose} aria-label={t('Tutup')}>
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="drawer-content">
          <FollowUpIdentity c={c} />
          <FollowUpContact c={c} />
          {blocked && (
            <div className="blocked-banner">
              <span>{t('!')}</span>
              <div>
                <strong>{t('Follow-up diblokir')}</strong>
                <p>{t(c.blockReason)}</p>
              </div>
            </div>
          )}
          <div className="detail-tabs">
            <button
              className={tab === 'Ringkasan' ? 'active' : ''}
              onClick={() => setTab('Ringkasan')}
            >
              {t('Ringkasan ')}
            </button>
            <button className={tab === 'Riwayat' ? 'active' : ''} onClick={() => setTab('Riwayat')}>
              {t('Riwayat ')}
              <span>{t((c.history?.length ?? 0) + 2)}</span>
            </button>
          </div>
          {tab === 'Ringkasan' ? (
            <>
              <FollowUpSummary customer={c} eligible={eligible} />
              {eligible && (ownTask || canClaim) && (
                <>
                  {canClaim && (
                    <div className="claim-box">
                      <div>
                        <strong>{t('Follow-up ini belum memiliki PIC')}</strong>
                        <p>{t('Ambil tugas untuk mulai menyiapkan pesan.')}</p>
                      </div>
                      <Button
                        onClick={() => {
                          update(c.id, { owner: user.name.split(' ')[0] });
                          notify(`Follow-up ${c.name} ditugaskan kepada Anda`);
                        }}
                      >
                        {t('Ambil follow-up ')}
                      </Button>
                    </div>
                  )}
                  <FollowUpComposer
                    customer={c}
                    tone={tone}
                    setTone={setTone}
                    draft={draft}
                    setDraft={setDraft}
                    loading={loading}
                    ownTask={ownTask}
                    generate={generate}
                    notify={notify}
                    onReview={() => setModal('review')}
                  />
                </>
              )}
            </>
          ) : (
            <History customer={c} />
          )}
        </div>
        {!ownTask && !canClaim && (
          <p className="task-readonly">
            {t('Mode baca: tugas ini milik ')}
            {t(c.owner)}
            {t('. Hubungi supervisor untuk pengalihan PIC.')}
          </p>
        )}
        <FollowUpDrawerActions
          setModal={setModal}
          blocked={blocked}
          ownTask={ownTask}
          supervisor={supervisor}
        />
      </aside>
      {modal === 'review' && ownTask && (
        <ReviewFollowUpAction
          c={c}
          draft={draft}
          setModal={setModal}
          ownTask={ownTask}
          update={update}
          notify={notify}
        />
      )}
      {modal === 'delay' && ownTask && (
        <DelayFollowUpModal
          setModal={setModal}
          update={update}
          c={c}
          delayDate={delayDate}
          notify={notify}
          setDelayDate={setDelayDate}
        />
      )}
      {modal === 'assign' && supervisor && (
        <AssignFollowUpModal
          setModal={setModal}
          supervisor={supervisor}
          assignReason={assignReason}
          update={update}
          c={c}
          newOwner={newOwner}
          user={user}
          notify={notify}
          setNewOwner={setNewOwner}
          setAssignReason={setAssignReason}
        />
      )}
      {modal === 'result' && ownTask && (
        <RecordFollowUpAction setModal={setModal} update={update} c={c} notify={notify} />
      )}
    </div>
  );
}
