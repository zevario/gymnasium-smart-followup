import { PilotTaskSummary } from './PilotTaskSummary.jsx';
import { PilotTaskComposer } from './PilotTaskComposer.jsx';
import { PilotTaskActions } from './PilotTaskActions.jsx';
import { PilotTaskActionForm } from './PilotTaskActionForm.jsx';
import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { Button } from '../../../shared/components/Button.jsx';

import { Badge } from '../../../shared/components/Badge.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

import { PilotTaskHistory } from './PilotTaskHistory.jsx';

export function PilotTask({ task, user, people, refresh, close }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(task.draft || '');
  const [note, setNote] = useState('');
  const [until, setUntil] = useState('');
  const [owner, setOwner] = useState('');
  const [review, setReview] = useState(false);
  const [draftVersion, setDraftVersion] = useState(task.version);
  const displayedDraft = draftVersion === task.version ? draft : task.draft || '';
  const [handoff, setHandoff] = useState(null);
  const [action, setAction] = useState('');
  useEffect(() => {
    if (!handoff) return;
    const timer = setTimeout(
      () => setHandoff(null),
      Math.max(0, Date.parse(handoff.validUntil) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [handoff]);
  const supervisor = user.roleCode === 'spv';
  const edit = task.ownerId === user.id || supervisor;
  async function submit(kind, extra = {}) {
    setBusy(true);
    setError('');
    try {
      const data = await api('/pilot/tasks/' + task.id + '/actions', 'POST', {
        action: kind,
        version: task.version,
        ...extra,
      });
      setHandoff(data.handoff || null);
      const rows = await refresh();
      const latest = rows.find((row) => row.id === task.id);
      setDraft(latest?.draft || '');
      setDraftVersion(latest?.version);
      setReview(false);
      setAction('');
      setNote('');
    } catch (e) {
      setError(e.message);
      setHandoff(null);
      setReview(false);
      await refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  const closed = task.status === 'Selesai';
  const choose = (kind) => {
    setAction(kind);
    setNote('');
    setError('');
    setReview(false);
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside
        className="detail-drawer pilot-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={task.name}
      >
        <header className="drawer-header">
          <Button variant="secondary" onClick={close}>
            {t('Kembali')}
          </Button>
          <Badge>{t(task.status)}</Badge>
        </header>
        <div className="drawer-content">
          <PilotTaskSummary task={task} />
          {task.blockReason && <p className="blocked-banner">{t(task.blockReason)}</p>}
          {!task.ownerId && !closed && (
            <Button disabled={busy} onClick={() => submit('claim')}>
              {t('Ambil follow-up')}
            </Button>
          )}
          {edit && task.ownerId && task.canPrepare && (
            <PilotTaskComposer
              task={task}
              busy={busy}
              draft={draft}
              displayedDraft={displayedDraft}
              onGenerate={() => submit('draft')}
              onDraftChange={(value) => {
                setDraft(value);
                setDraftVersion(task.version);
                setReview(false);
              }}
              onReview={() => {
                choose('approve');
                setDraft(displayedDraft);
                setDraftVersion(task.version);
                setReview(true);
              }}
            />
          )}
          {handoff &&
            task.permission === 'Aktif' &&
            !closed &&
            task.version === handoff.version &&
            task.pending === handoff.attempt && (
              <div className="source-box">
                <strong>{t('Disetujui untuk kanal manual')}</strong>
                <p>{handoff.phone}</p>
                <p>{handoff.message}</p>
                <small>
                  {t('Kirim sekali melalui kanal resmi, lalu catat konfirmasinya di sini.')}
                </small>
              </div>
            )}
          <PilotTaskActions
            task={task}
            edit={edit}
            closed={closed}
            supervisor={supervisor}
            busy={busy}
            choose={choose}
          />
          {action &&
            (action !== 'approve' || (review && draftVersion === task.version && task.draft)) && (
              <PilotTaskActionForm
                task={task}
                people={people}
                action={action}
                review={review}
                draft={draft}
                note={note}
                setNote={setNote}
                until={until}
                setUntil={setUntil}
                owner={owner}
                setOwner={setOwner}
                busy={busy}
                submit={submit}
              />
            )}
          {error && <p role="alert">{error}</p>}
          <PilotTaskHistory taskId={task.id} version={task.version} />
        </div>
      </aside>
    </div>
  );
}
