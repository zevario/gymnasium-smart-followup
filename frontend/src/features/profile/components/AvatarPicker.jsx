import { avatarNames } from '../utils/avatarNames.js';

import { useT } from '../../../shared/i18n/useLanguage.js';

import { profileAvatars } from '../utils/profilePhoto.js';

export function AvatarPicker({ busy, avatarDraft, setAvatarDraft, setError }) {
  const t = useT();
  return (
    <div className="photo-avatar-options" aria-label={t('Pilihan avatar')}>
      {profileAvatars.map((src, index) => (
        <button
          key={src}
          type="button"
          disabled={busy}
          aria-label={t(avatarNames[index])}
          aria-pressed={avatarDraft === src}
          onClick={() => {
            setAvatarDraft(src);
            setError('');
          }}
        >
          <img src={src} alt={t('')} width={84} height={84} />
        </button>
      ))}
    </div>
  );
}
