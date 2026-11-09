export function LoginEmailPicker({
  accounts,
  email,
  onEmailChange,
  showAccounts,
  setShowAccounts,
  onSelectAccount,
  t,
}) {
  return (
    <div
      className="form-group email-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setShowAccounts(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.querySelector('input')?.focus();
          setShowAccounts(false);
        }
      }}
    >
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="off"
        required
        placeholder="nama@gymnasyum.id"
        value={email}
        onFocus={() => setShowAccounts(true)}
        onClick={() => setShowAccounts(true)}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      {showAccounts && (
        <div className="login-demos" role="group" aria-label={t('Pilih akun demo')}>
          <small>{t('Pilih akun demo')}</small>
          {accounts.map((user) => (
            <button
              type="button"
              key={user.email}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onSelectAccount(user)}
            >
              <strong>{user.name}</strong> · {user.role}
              <small>{user.email}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
