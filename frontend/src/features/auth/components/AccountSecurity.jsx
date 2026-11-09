import { PasswordRequirements } from './PasswordRequirements.jsx';
import { PasswordField } from './PasswordField.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';
export default function AccountSecurity({ demoPassword }) {
  const t = useT();
  const [values, setValues] = useState(['', '', '']);
  const [visible, setVisible] = useState([false, false, false]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const rules = [
    { label: 'Minimal 8 karakter', valid: values[1].length >= 8 },
    { label: 'Minimal satu huruf kecil', valid: /[a-z]/.test(values[1]) },
    { label: 'Minimal satu huruf besar (kapital)', valid: /[A-Z]/.test(values[1]) },
    { label: 'Berbeda dari password sebelumnya', valid: !!values[1] && values[1] !== values[0] },
  ];
  const labels = ['Password Lama', 'Password Baru', 'Konfirmasi Password Baru'];
  return (
    <section className="card account-security" aria-labelledby="security-heading">
      <form
        className="security-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSuccess(false);
          if (values[0] !== demoPassword) {
            setError('Password lama tidak sesuai dengan akun demo.');
            return;
          }
          if (rules.some((rule) => !rule.valid)) {
            setError('Password baru belum memenuhi semua persyaratan.');
            return;
          }
          if (values[1] !== values[2]) {
            setError('Konfirmasi password baru belum sama.');
            return;
          }
          setError('');
          setSuccess(true);
          setValues(['', '', '']);
          setVisible([false, false, false]);
        }}
      >
        <div>
          <h2 id="security-heading">{t('Ubah Password')}</h2>
          <p>{t('Masukkan password lama dan password baru Anda.')}</p>
        </div>
        <p className="security-demo-note">
          {t(
            'Mode demo: formulir ini hanya mensimulasikan perubahan password. Password login tetap sama.',
          )}
        </p>
        {labels.map((label, index) => (
          <PasswordField
            key={label}
            label={label}
            index={index}
            visible={visible}
            values={values}
            setValues={setValues}
            setError={setError}
            setSuccess={setSuccess}
            setVisible={setVisible}
          />
        ))}
        {error && (
          <p className="security-error" role="alert">
            {t(error)}
          </p>
        )}
        {success && (
          <p className="security-success" role="status">
            {t(
              'Simulasi berhasil. Password baru memenuhi persyaratan; password login demo tidak berubah.',
            )}
          </p>
        )}
        <button className="btn btn-primary" type="submit">
          {t('Update Password')}
        </button>
      </form>
      <PasswordRequirements rules={rules} />
    </section>
  );
}
