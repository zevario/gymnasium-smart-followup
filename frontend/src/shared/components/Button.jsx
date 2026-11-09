import { useT } from '../i18n/useLanguage.js';

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  className = '',
  type = 'button',
}) {
  const t = useT();
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {t(children)}
    </button>
  );
}
