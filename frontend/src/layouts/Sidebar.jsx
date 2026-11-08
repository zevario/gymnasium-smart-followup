import logo from "../assets/images/gymnasyum-logo.png"
import { useT } from "../i18n/useLanguage.js"
import { useState, useRef, useEffect } from "react"
import { Icon } from "../components/Controls/Controls.jsx"
import { Button } from "../components/Button/Button.jsx"
import { permissions } from "../features/auth/services/access.js"
import { mayOpenPage } from "../routes/pageAccess.js"
import { demoAccounts, accountRoles } from "../features/auth/services/demoAccounts.js"

export function Sidebar({ page, navigate, open, count, memberCount, user, onLogout, onToggle, }) {
    const t = useT();
    const [locationOpen, setLocationOpen] = useState(false);
    const locationTrigger = useRef(null);
    const top = [
        ["Dashboard", "dashboard"],
        ["Semua follow-up", "list"],
        ["Pelanggan", "users"],
        ["Laporan", "chart"],
        ["Pengaturan", "settings"],
    ];
    return (<>
    <aside id="app-sidebar" className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <img className="brand-logo" src={logo} alt={t("Logo Gymnasyum")} width={40} height={40}/>
        <span>
          <strong>{t("gymnasyum")}</strong>
          <small>{t("MEMBER RELATIONS")}</small>
        </span>
      </div>
      <button type="button" className="location location-trigger" ref={locationTrigger} aria-label={t("Lihat lokasi aktif: Gymnasyum Bintaro")} aria-haspopup="dialog" aria-expanded={locationOpen} aria-controls={locationOpen ? "location-dialog" : undefined} onClick={() => setLocationOpen(true)}>
        <span className="location-pin" aria-hidden="true"><LocationPin /></span>
        <span className="location-trigger-copy"><small><span className="location-dot"/>{t("Lokasi aktif")}</small><strong>{t("Gymnasyum Bintaro")}</strong></span>
        <Icon name="chevron" size={15}/>
      </button>
      <nav className="nav">
        {top.filter(([label]) => mayOpenPage(user, label)).map(([label, icon]) => (<button key={label} title={t(label)} aria-label={t(label)} aria-current={page === label ? "page" : undefined} className={page === label ? "active" : ""} onClick={() => navigate(label)}>
            <Icon name={icon}/>
            <span>{t(label)}</span>
            {label === "Dashboard" && <i>{t(count)}</i>}
          </button>))}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="profile sidebar-logout" onClick={onLogout} aria-label={t("Logout")} title={t("Logout")}>
          <Icon name="logout" size={22}/>
          <span>{t("Logout")}</span>
        </button>
      </div>
    </aside>
    {locationOpen && <LocationDialog user={user} memberCount={memberCount} followupCount={count} close={() => { setLocationOpen(false); requestAnimationFrame(() => locationTrigger.current?.focus()); }} onNavigate={() => { setLocationOpen(false); navigate(permissions(user).system ? "Pengaturan" : "Pelanggan"); }}/>}
    <button className={`sidebar-edge-toggle ${open ? "is-expanded" : ""}`} onClick={onToggle} aria-label={t(open ? "Perkecil sidebar" : "Perluas sidebar")} title={t(open ? "Perkecil sidebar" : "Perluas sidebar")} aria-expanded={open} aria-controls="app-sidebar">
      <Icon name="chevron" size={22}/>
    </button>
    </>);
}

export function LocationPin() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
}

export function LocationDialog({ user, memberCount, followupCount, close, onNavigate }) {
    const t = useT();
    const dialogRef = useRef(null);
    const system = permissions(user).system;
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => { if (dialog?.open)
            dialog.close(); };
    }, []);
    return <dialog ref={dialogRef} id="location-dialog" className="location-dialog" aria-labelledby="location-dialog-title" aria-describedby="location-dialog-description" onKeyDown={(event) => { if (event.key === "Escape")
        event.stopPropagation(); }} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => {
            if (event.target !== event.currentTarget)
                return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
                close();
        }}>
    <div className="location-dialog-header">
      <div><span className="location-eyebrow">{t("RUANG KERJA ANDA")}</span><h2 id="location-dialog-title">{t("Lokasi aktif")}</h2></div>
      <button type="button" className="location-dialog-close" onClick={close} aria-label={t("Tutup informasi lokasi")} autoFocus><Icon name="close" size={18}/></button>
    </div>
    <div className="location-dialog-body">
      <div className="location-hero"><span className="location-hero-icon"><LocationPin /></span><div><h3>{t("Gymnasyum Bintaro")}</h3><p>{t("Smart Follow-up · Member Relations")}</p></div><span className="location-selected"><Icon name="check" size={12}/>{t("Aktif")}</span></div>
      <p id="location-dialog-description" className="location-description">{user.live ? "Gymnasyum Bintaro · Asia/Jakarta" : t("Anda sedang bekerja di lokasi Bintaro. Seluruh aktivitas pada ruang kerja ini menggunakan data demo lokasi tersebut.")}</p>
      {!user.live && <div className="location-summary">
        <div><span className="location-stat-icon"><Icon name="users" size={18}/></span><span><strong>{t(system ? demoAccounts.length : memberCount)}</strong><small>{t(system ? "Akun terdaftar" : "Member dalam demo")}</small></span></div>
        <div><span className="location-stat-icon"><Icon name={system ? "settings" : "list"} size={18}/></span><span><strong>{t(system ? accountRoles.length : followupCount)}</strong><small>{t(system ? "Peran pengguna" : "Follow-up hari ini")}</small></span></div>
      </div>}
      <div className="location-access"><span className="avatar">{t(user.initials)}</span><div><strong>{t(user.name)}</strong><span>{t(user.role)}</span></div><Icon name="check" size={16}/></div>
      {!user.live && <p className="location-demo-note"><LocationPin />{t("Saat ini tersedia satu lokasi demo. Lokasi lain belum ditambahkan.")}</p>}
    </div>
    <div className="location-dialog-footer"><Button variant="secondary" onClick={close}>{t("Tutup")}</Button><Button onClick={onNavigate}>{t(system ? "Kelola akun" : "Lihat member")}<Icon name="chevron" size={15}/></Button></div>
  </dialog>;
}
