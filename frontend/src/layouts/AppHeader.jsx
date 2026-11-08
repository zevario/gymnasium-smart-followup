import logo from "../assets/images/gymnasyum-logo.png"
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher.jsx"
import { useT, useLanguage } from "../i18n/useLanguage.js"
import { useState, useEffect, useRef } from "react"
import { mayEditTask } from "../features/auth/services/access.js"
import { canContact } from "../features/followups/services/followupRules.js"
import { authenticateDemo, accountRoles, demoAccounts, demoPassword, roleDescriptions } from "../features/auth/services/demoAccounts.js"
import { Icon, Badge } from "../components/Controls/Controls.jsx"
import { Button } from "../components/Button/Button.jsx"
import { ModalShell } from "../components/ModalShell/ModalShell.jsx"

export function ThemeToggle() {
    const t = useT();
    const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === "light" ? "light" : "dark");
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("gymnasyum-theme", theme);
        }
        catch { /* Keep the toggle usable when storage is unavailable. */ }
    }, [theme]);
    const label = theme === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode";
    return <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={t(label)} title={t(label)}>
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      {theme === "dark" ? <path fill="currentColor" d="M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z"/> : <><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>}
    </svg>
  </button>;
}

export function Notifications({ account, customers, onOpen }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const container = useRef(null);
    const trigger = useRef(null);
    const storageKey = `gymnasyum-notifications-read:${account.email}`;
    const [read, setRead] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
        }
        catch {
            return [];
        }
    });
    const items = customers.filter((customer) => (account.live ? (account.roleCode==="spv" || customer.ownerId===account.id) : mayEditTask(account, customer.owner)) && customer.status === "Perlu ditinjau" && canContact(customer)).map((customer) => ({
        id: `${customer.id}:${customer.status}:${customer.deadline}:${customer.owner}`,
        customer,
    }));
    const unread = items.filter((item) => !read.includes(item.id)).length;
    const markRead = (ids) => {
        const next = [...new Set([...read, ...ids])];
        setRead(next);
        try {
            localStorage.setItem(storageKey, JSON.stringify(next));
        }
        catch { /* Keep read state for this session. */ }
    };
    useEffect(() => {
        const outside = (event) => { if (!container.current?.contains(event.target))
            setOpen(false); };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);
    return <div className="notification-container" ref={container} onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
                event.stopPropagation();
                setOpen(false);
                trigger.current?.focus();
            }
        }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget))
        setOpen(false); }}>
    <button ref={trigger} className="icon-button" aria-label={t(`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`)} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen(!open)}>
      <Icon name="bell"/>{unread > 0 && <i />}
    </button>
    {open && <section className="notification-panel" id="notification-panel" aria-label={t("Daftar notifikasi")}>
      <div className="notification-heading">
        <div className="notification-title"><span className="notification-bell"><Icon name="bell" size={20}/></span><div><strong>{t("Notifikasi")}</strong><p>{t("Aktivitas dan pengingat Anda")}</p></div></div>
        <button className="notification-close" aria-label={t("Tutup notifikasi")} onClick={() => { setOpen(false); trigger.current?.focus(); }}><Icon name="close" size={18}/></button>
      </div>
      <div className="notification-toolbar"><span className="notification-count">{t(unread ? `${unread} belum dibaca` : "Semua sudah dibaca")}</span>
        {items.length > 0 && <button className="notification-read-all" disabled={!unread} onClick={() => markRead(items.map((item) => item.id))}><Icon name="check" size={14}/> {t("Tandai semua")}</button>}
      </div>
      {items.length > 0 ? <>
        <div className="notification-list">{items.map(({ id, customer }) => <button key={id} className={`notification-item ${read.includes(id) ? "" : "is-unread"}`} onClick={() => { markRead([id]); setOpen(false); onOpen(customer); }}>
          <span className="notification-avatar" aria-hidden="true">{t(customer.initials)}</span>
          <span className="notification-copy"><span className="notification-item-title"><strong>{t(customer.name)}</strong>{!read.includes(id) && <span className="notification-dot" aria-label={t("Belum dibaca")}/>}</span>
          <span className="notification-description">{t("Follow-up ")}{t(customer.goal.toLowerCase())} {t("siap ditinjau.")}</span>
          <small className="notification-time"><Icon name="clock" size={12}/>{t(customer.deadline)}</small>
          <span className="notification-item-footer"><small>{t("Petugas: ")}{t(customer.owner)}</small><span>{t("Lihat detail ")}<Icon name="chevron" size={12}/></span></span></span>
        </button>)}</div>
      </> : <div className="notification-empty"><span className="notification-empty-icon"><Icon name="check" size={26}/></span><strong>{t("Belum ada pengingat")}</strong><p>{t("Tugas follow-up yang siap ditinjau akan muncul di sini.")}</p></div>}
      <p className="notification-footnote">{t(account.live?"Berdasarkan antrean lokasi aktif.":"Berdasarkan tugas follow-up demo yang dapat Anda akses.")}</p>
    </section>}
  </div>;
}

export function Header({ page, account, photo, customers, onOpenNotification, onLogin, onLogout, onProfile }) {
    const t = useT();
    const { language } = useLanguage();
    const [accountMode, setAccountMode] = useState(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const avatarRef = useRef(null);
    useEffect(() => {
        const outside = (event) => {
            if (!profileMenuRef.current?.contains(event.target))
                setProfileMenuOpen(false);
        };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);
    useEffect(() => {
        const close = (event) => {
            if (event.key === "Escape") {
                setAccountMode(null);
                setProfileMenuOpen(false);
                if (profileMenuRef.current?.contains(document.activeElement))
                    avatarRef.current?.focus();
            }
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, []);
    return (<>
    <header className="header">
      <div className="breadcrumb">
        <span>{t("Smart Follow-up")}</span>
        <Icon name="chevron" size={14}/>
        <strong>{t(language === "en" ? { "Semua follow-up": "All follow-ups", Pelanggan: "Customers", Laporan: "Reports", Pengaturan: "Settings", Profil: "Profile" }[page] ?? page : page)}</strong>
      </div>
      <div className="header-right">
        <Badge tone="demo">{account?.live ? "Bintaro" : t(language === "en" ? "Demo mode" : "Mode demo")}</Badge>
        {account && <Notifications key={account.email} account={account} customers={customers} onOpen={onOpenNotification}/>}
        <div className="account-actions">
          <div className="header-preferences"><LanguageSwitcher /><span aria-hidden="true"/><ThemeToggle /></div>
          <span className="theme-divider" aria-hidden="true"/>
          {account ? (<div className="header-profile" ref={profileMenuRef} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setProfileMenuOpen(false);
            }}>
              <button ref={avatarRef} className="header-profile-avatar" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} aria-controls="header-profile-dropdown" aria-label={t("Menu profil")} title={t("Menu profil")}>
                <img src={photo} alt={t(`Foto profil ${account.name}`)} width={40} height={40}/>
              </button>
              {profileMenuOpen && <div id="header-profile-dropdown" className="header-profile-dropdown" aria-label={t("Menu akun")}>
                <div className="header-profile-identity">
                  <strong>{t(account.name)}</strong>
                  <span>{t(account.email)}</span>
                </div>
                <button onClick={() => { setProfileMenuOpen(false); onProfile(); }}>{t("Lihat profil")}</button>
                <button className="profile-logout" onClick={() => { setProfileMenuOpen(false); onLogout(); }}>{t("Keluar")}</button>
              </div>}
            </div>) : (<>
              <Button variant="secondary" onClick={() => setAccountMode("login")}>{t("Login")}</Button>
              <Button onClick={() => setAccountMode("signup")}>{t("Sign Up")}</Button>
            </>)}
        </div>
      </div>
    </header>
    {accountMode === "login" && (<LoginForm close={() => setAccountMode(null)} onSuccess={(user) => { onLogin(user); setAccountMode(null); }}/>)}
    {accountMode === "signup" && (<ModalShell title={t("Daftar Smart Follow-up")} close={() => setAccountMode(null)}>
        <div className="modal-body">
          <Badge tone="demo">{t(language === "en" ? "Demo mode" : "Mode demo")}</Badge>
          <p className="account-description">
            {t("Pendaftaran akun belum tersedia. Gunakan akun demo melalui menu Login. ")}</p>
          <p className="modal-note">
            {t("Akun staf sungguhan akan disediakan oleh administrator setelah layanan autentikasi terhubung. ")}</p>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setAccountMode("login")}>
            {t("Masuk ")}</Button>
          <Button onClick={() => setAccountMode(null)}>{t("Lanjutkan demo")}</Button>
        </div>
      </ModalShell>)}
    </>);
}

export function LoginForm({ close, onSuccess }) {
    const t = useT();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    return (<ModalShell title={t("Masuk ke Gymnasyum")} close={close}>
      <form onSubmit={(event) => {
            event.preventDefault();
            authenticateDemo(email, password, onSuccess, setError);
        }}>
        <div className="modal-body login-form">
          <div className="login-intro">
            <img src={logo} alt={t("Logo Gymnasyum")} width={48} height={48}/>
            <div><h3>{t("Selamat datang kembali")}</h3><p>{t("Pilih akun demo sesuai peran untuk mencoba aplikasi.")}</p></div>
          </div>
          <label htmlFor="login-email">{t("Email ")}<input id="login-email" type="email" autoComplete="username" autoFocus required placeholder={t("nama@gymnasyum.id")} value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}/>
          </label>
          <label htmlFor="login-password">{t("Kata sandi ")}<div className="login-password">
              <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} onChange={(e) => { setPassword(e.target.value); setError(""); }}/>
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-pressed={showPassword}>
                {t(showPassword ? "Sembunyikan" : "Lihat")}
              </button>
            </div>
          </label>
          {error && <p id="login-error" className="warning-box" role="alert">{t(error)}</p>}
          <div className="login-demo-info">
            <strong>{t("Pilih akun demo")}</strong>
            <div className="demo-account-list">
              {accountRoles.map((role) => demoAccounts.find((user) => user.role === role)).filter((user) => Boolean(user)).map((user) => (<button key={user.email} type="button" onClick={() => { setEmail(user.email); setPassword(demoPassword); setError(""); }}>
                  <span>{t(user.name)}</span><small>{t(user.role)}</small><span className="demo-account-email">{t(user.email)}</span><small>{t(roleDescriptions[user.role])}</small>
                </button>))}
            </div>
            <p>{t("Kata sandi semua akun: ")}{t(demoPassword)}</p>
            <small>{t("Login ini hanya untuk demo lokal. Gunakan kredensial contoh di atas.")}</small>
          </div>
          <button className="btn btn-primary login-submit" type="submit">{t("Masuk")}</button>
        </div>
      </form>
    </ModalShell>);
}
