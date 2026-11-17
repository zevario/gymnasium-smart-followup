export function LoginEmailPicker({ email, onEmailChange, t }) {
  return (
    <div className="form-group">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        placeholder={t('Email')}
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
    </div>
  );
}
