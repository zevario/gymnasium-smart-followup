import { Icon } from './Icon.jsx';

import { useT } from '../i18n/useLanguage.js';

export function Field({ icon, value, onChange, placeholder }) {
  const t = useT();
  return (
    <label className="field">
      {icon && <Icon name={icon} size={17} />}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholder)}
      />
    </label>
  );
}
