import { useT } from "../../../i18n/useLanguage.js";
import { useState } from "react";
export default function AccountSecurity({ demoPassword }) {
    const t = useT();
    const [values, setValues] = useState(["", "", ""]);
    const [visible, setVisible] = useState([false, false, false]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const rules = [
        { label: "Minimal 8 karakter", valid: values[1].length >= 8 },
        { label: "Minimal satu huruf kecil", valid: /[a-z]/.test(values[1]) },
        { label: "Minimal satu huruf besar (kapital)", valid: /[A-Z]/.test(values[1]) },
        { label: "Berbeda dari password sebelumnya", valid: !!values[1] && values[1] !== values[0] },
    ];
    const labels = ["Password Lama", "Password Baru", "Konfirmasi Password Baru"];
    return <section className="card account-security" aria-labelledby="security-heading">
    <form className="security-form" onSubmit={(event) => {
            event.preventDefault();
            setSuccess(false);
            if (values[0] !== demoPassword) {
                setError("Password lama tidak sesuai dengan akun demo.");
                return;
            }
            if (rules.some(rule => !rule.valid)) {
                setError("Password baru belum memenuhi semua persyaratan.");
                return;
            }
            if (values[1] !== values[2]) {
                setError("Konfirmasi password baru belum sama.");
                return;
            }
            setError("");
            setSuccess(true);
            setValues(["", "", ""]);
            setVisible([false, false, false]);
        }}>
      <div><h2 id="security-heading">{t("Ubah Password")}</h2><p>{t("Masukkan password lama dan password baru Anda.")}</p></div>
      <p className="security-demo-note">{t("Mode demo: formulir ini hanya mensimulasikan perubahan password. Password login tetap sama.")}</p>
      {labels.map((label, index) => <div className="security-field" key={label}>
        <label htmlFor={`security-password-${index}`}>{t(label)}</label>
        <div className="security-input">
          <input id={`security-password-${index}`} type={visible[index] ? "text" : "password"} required maxLength={128} autoComplete={index === 0 ? "current-password" : "new-password"} placeholder={t(`Masukkan ${label.toLowerCase()}`)} value={values[index]} aria-describedby={index === 1 ? "password-requirements" : undefined} onChange={(event) => { setValues(previous => previous.map((value, i) => i === index ? event.target.value : value)); setError(""); setSuccess(false); }}/>
          <button type="button" aria-label={t(`${visible[index] ? "Sembunyikan" : "Tampilkan"} ${label.toLowerCase()}`)} aria-pressed={visible[index]} onClick={() => setVisible(previous => previous.map((value, i) => i === index ? !value : value))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!visible[index] && <path d="m3 3 18 18"/>}</svg>
          </button>
        </div>
      </div>)}
      {error && <p className="security-error" role="alert">{t(error)}</p>}
      {success && <p className="security-success" role="status">{t("Simulasi berhasil. Password baru memenuhi persyaratan; password login demo tidak berubah.")}</p>}
      <button className="btn btn-primary" type="submit">{t("Update Password")}</button>
    </form>
    <aside className="password-requirements" id="password-requirements">
      <h3>{t("Persyaratan Password")}</h3>
      <p>{t("Gunakan password yang kuat dengan ketentuan berikut.")}</p>
      <ul>{rules.map(rule => <li key={rule.label} className={rule.valid ? "is-valid" : ""}><span aria-hidden="true">{t(rule.valid ? "✓" : "•")}</span>{t(rule.label)}</li>)}</ul>
    </aside>
  </section>;
}
