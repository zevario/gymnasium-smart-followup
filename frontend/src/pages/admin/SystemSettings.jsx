import { useT } from "../../i18n/useLanguage.js"
import { useContext, useState } from "react"
import { AccountContext } from "../../features/auth/context/AccountContext.js"
import { demoAccounts, accountRoles, replaceDemoAccounts, demoPassword, roleDescriptions } from "../../features/auth/services/demoAccounts.js"
import { permissions } from "../../features/auth/services/access.js"
import { PageIntro, Avatar, Badge } from "../../components/Controls/Controls.jsx"
import { Button } from "../../components/Button/Button.jsx"

export function SystemSettings() {
    const t = useT();
    const user = useContext(AccountContext);
    const [disabledAccounts, setDisabledAccounts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("gymnasyum-disabled-accounts") || "[]");
        }
        catch {
            return [];
        }
    });
    const [accounts, setAccounts] = useState(demoAccounts);
    const [draft, setDraft] = useState({ name: "", email: "", role: accountRoles[0] });
    const [message, setMessage] = useState("");
    const saveAccounts = (next) => {
        try {
            localStorage.setItem("gymnasyum-demo-accounts-v2", JSON.stringify(next));
            replaceDemoAccounts(next);
            setAccounts(next);
            setMessage("Data akun demo berhasil disimpan.");
            return true;
        }
        catch {
            setMessage("Data gagal disimpan. Periksa penyimpanan browser.");
            return false;
        }
    };
    const [connection, setConnection] = useState("Belum terhubung");
    if (!permissions(user).system)
        return null;
    const toggleAccount = (email) => {
        if (email === user?.email)
            return;
        const next = disabledAccounts.includes(email) ? disabledAccounts.filter((value) => value !== email) : [...disabledAccounts, email];
        try {
            localStorage.setItem("gymnasyum-disabled-accounts", JSON.stringify(next));
            setDisabledAccounts(next);
            setMessage("Status akun berhasil diperbarui.");
        }
        catch {
            setMessage("Status akun gagal disimpan.");
        }
    };
    return <>
    <PageIntro eyebrow="ADMINISTRATOR SISTEM" title={t("Administrasi sistem")} subtitle="Kelola akses akun demo dan periksa kesiapan koneksi. Data pelanggan dibatasi untuk peran operasional."/>
    <section className="card system-panel">
      <h2>{t("Akun dan hak akses")}</h2>
      <p>{t("Administrator membuat akun, mengubah peran, dan menonaktifkan akses karyawan. Admin/CS dan Sales menggunakan satu peran operasional.")}</p>
      <form className="account-create-form" onSubmit={(event) => {
            event.preventDefault();
            const name = draft.name.trim();
            const email = draft.email.trim().toLowerCase();
            if (!name) {
                setMessage("Nama lengkap wajib diisi.");
                return;
            }
            if (accounts.some((member) => member.email === email)) {
                setMessage("Email sudah digunakan oleh akun lain.");
                return;
            }
            if (saveAccounts([...accounts, { name, email, role: draft.role, initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() }]))
                setDraft({ name: "", email: "", role: accountRoles[0] });
        }}>
        <label>{t("Nama lengkap")}<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></label>
        <label>{t("Email")}<input required type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/></label>
        <label>{t("Peran")}<select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>{accountRoles.map((role) => <option key={role} value={role}>{t(role)}</option>)}</select></label>
        <Button type="submit">{t("Buat akun")}</Button>
      </form>
      <p>{t("Akun demo tersimpan di browser ini. Kata sandi demo: ")}{t(demoPassword)}</p>
      {message && <p role="status">{t(message)}</p>}
      <div className="system-accounts">{accounts.map((member) => <div key={member.email}>
        <Avatar initials={member.initials} dark/>
        <div><strong>{t(member.name)}</strong><small>{t(member.email)}</small><select aria-label={t(`Peran ${member.name}`)} disabled={member.email === user?.email} value={member.role} onChange={(event) => saveAccounts(accounts.map((item) => item.email === member.email ? { ...item, role: event.target.value } : item))}>{accountRoles.map((role) => <option key={role} value={role}>{t(role)}</option>)}</select><small>{t(roleDescriptions[member.role])}</small></div>
        <Badge tone={disabledAccounts.includes(member.email) ? "warning" : "active"}>{t(disabledAccounts.includes(member.email) ? "Nonaktif" : "Aktif")}</Badge>
        <Button variant="secondary" disabled={member.email === user?.email} onClick={() => toggleAccount(member.email)}>{t(member.email === user?.email ? "Akun Anda" : disabledAccounts.includes(member.email) ? "Aktifkan" : "Nonaktifkan")}</Button>
      </div>)}</div>
    </section>
    <section className="card system-panel">
      <h2>{t("Kesehatan koneksi")}</h2><p>{t("Mode demo lokal · belum ada integrasi ke sumber data atau penyedia pesan.")}</p>
      <dl className="system-connections"><div><dt>{t("Data membership")}</dt><dd>{t(connection)}</dd></div><div><dt>{t("Kanal pesan")}</dt><dd>{t(connection)}</dd></div><div><dt>{t("Layanan AI")}</dt><dd>{t(connection)}</dd></div></dl>
      <Button variant="secondary" onClick={() => setConnection("Demo lokal — koneksi belum dikonfigurasi")}>{t("Periksa koneksi")}</Button>
    </section>
  </>;
}
