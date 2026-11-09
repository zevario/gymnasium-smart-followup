import { useT } from '../../../shared/i18n/useLanguage.js';

export function PasswordField({
  label,
  index,
  visible,
  values,
  setValues,
  setError,
  setSuccess,
  setVisible,
}) {
  const t = useT();
  return (
    <div className="security-field" key={label}>
      <label htmlFor={`security-password-${index}`}>{t(label)}</label>
      <div className="security-input">
        <input
          id={`security-password-${index}`}
          type={visible[index] ? 'text' : 'password'}
          required
          maxLength={128}
          autoComplete={index === 0 ? 'current-password' : 'new-password'}
          placeholder={t(`Masukkan ${label.toLowerCase()}`)}
          value={values[index]}
          aria-describedby={index === 1 ? 'password-requirements' : undefined}
          onChange={(event) => {
            setValues((previous) =>
              previous.map((value, i) => (i === index ? event.target.value : value)),
            );
            setError('');
            setSuccess(false);
          }}
        />
        <button
          type="button"
          aria-label={t(`${visible[index] ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`)}
          aria-pressed={visible[index]}
          onClick={() =>
            setVisible((previous) => previous.map((value, i) => (i === index ? !value : value)))
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {!visible[index] && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
