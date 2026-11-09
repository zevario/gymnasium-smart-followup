import { PhotoEditorActions } from './PhotoEditorActions.jsx';
import { PhotoUploadPanel } from './PhotoUploadPanel.jsx';
import { AvatarPicker } from './AvatarPicker.jsx';
import { PhotoSourceTabs } from './PhotoSourceTabs.jsx';

import { readPhoto } from '../utils/readPhoto.js';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useEffect, useRef, useState } from 'react';
import { defaultProfilePhoto, profileAvatars } from '../utils/profilePhoto.js';
export default function ProfilePhotoEditor({ photo, name, onSave, onClose }) {
  const t = useT();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const [tab, setTab] = useState(profileAvatars.includes(photo) ? 'avatar' : 'upload');
  const [avatarDraft, setAvatarDraft] = useState(
    profileAvatars.includes(photo) ? photo : defaultProfilePhoto,
  );
  const [uploadDraft, setUploadDraft] = useState(profileAvatars.includes(photo) ? '' : photo);
  const [dragging, setDragging] = useState(false);
  const draft = tab === 'avatar' ? avatarDraft : uploadDraft;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const requests = requestRef;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      requests.current++;
      dialog.close();
    };
  }, []);
  const selectPhoto = async (file) => {
    if (!file) return;
    const request = ++requestRef.current;
    setBusy(true);
    setError('');
    try {
      const result = await readPhoto(file);
      if (request === requestRef.current) setUploadDraft(result);
    } catch (cause) {
      if (request === requestRef.current)
        setError(
          cause instanceof Error ? cause.message : 'Foto tidak dapat dibaca. Pilih foto lain.',
        );
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  };
  const close = () => {
    dialogRef.current?.close();
    onClose();
  };
  return (
    <dialog
      ref={dialogRef}
      className="photo-editor"
      aria-labelledby="photo-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close();
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id="photo-editor-title">{t('Ubah Foto Profil')}</h2>
          <p className="photo-editor-subtitle">
            {t('Pilih karakter avatar atau upload foto Anda sendiri.')}
          </p>
        </div>
        <button type="button" aria-label={t('Tutup edit foto profil')} onClick={close}>
          {t('×')}
        </button>
      </div>
      <div className="photo-editor-body">
        <PhotoSourceTabs
          tab={tab}
          busy={busy}
          setTab={setTab}
          setError={setError}
          setDragging={setDragging}
        />
        <div
          role="tabpanel"
          id="photo-panel-avatar"
          aria-labelledby="photo-tab-avatar"
          hidden={tab !== 'avatar'}
        >
          <AvatarPicker
            busy={busy}
            avatarDraft={avatarDraft}
            setAvatarDraft={setAvatarDraft}
            setError={setError}
          />
        </div>
        <PhotoUploadPanel
          tab={tab}
          inputRef={inputRef}
          selectPhoto={selectPhoto}
          dragging={dragging}
          busy={busy}
          setDragging={setDragging}
          uploadDraft={uploadDraft}
          name={name}
        />
        {error && (
          <p className="photo-editor-error" role="alert">
            {t(error)}
          </p>
        )}
      </div>
      <PhotoEditorActions
        close={close}
        busy={busy}
        draft={draft}
        photo={photo}
        onSave={onSave}
        setError={setError}
        tab={tab}
      />
    </dialog>
  );
}
