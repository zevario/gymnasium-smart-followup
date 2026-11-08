import { useT } from "../i18n/useLanguage.js"
import { useState } from "react"
import { PageIntro, Icon, Badge } from "../components/Controls/Controls.jsx"
import { Button } from "../components/Button/Button.jsx"
import ProfilePhotoEditor from "../features/profile/components/ProfilePhotoEditor.jsx"
import AccountSecurity from "../features/auth/components/AccountSecurity.jsx"
import { demoPassword } from "../features/auth/services/demoAccounts.js"

export function Profile({ user, photo, onSavePhoto }) {
    const t = useT();
    const [profileTab, setProfileTab] = useState("profile");
    const [editingPhoto, setEditingPhoto] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveFailed, setSaveFailed] = useState(false);
    const saveAccountData = () => {
        try {
            localStorage.setItem(`gymnasyum-account-v1:${user.email}`, JSON.stringify({
                name: user.name, email: user.email, role: user.role, location: "Gymnasyum Bintaro",
            }));
            onSavePhoto(photo);
            setSaveFailed(false);
            setSaveMessage("Data akun tersimpan di browser ini.");
        }
        catch {
            setSaveFailed(true);
            setSaveMessage("Data belum tersimpan. Penyimpanan browser tidak tersedia atau penuh.");
        }
    };
    return (<>
      <PageIntro eyebrow="AKUN SAYA" title={t("Profil saya")} subtitle="Informasi akun dan peran Anda di Gymnasyum."/>
      <div className="profile-tabs" role="tablist" aria-label={t("Pengaturan akun")}>
        {["profile", "security"].map((tab, index) => <button key={tab} type="button" role="tab" id={`account-tab-${tab}`} aria-selected={profileTab === tab} aria-controls={`account-panel-${tab}`} tabIndex={profileTab === tab ? 0 : -1} onClick={() => setProfileTab(tab)} onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                    return;
                event.preventDefault();
                const next = event.key === "Home" ? "profile" : event.key === "End" ? "security" : index === 0 ? "security" : "profile";
                setProfileTab(next);
                document.getElementById(`account-tab-${next}`)?.focus();
            }}>{t(tab === "profile" ? "Profil" : "Keamanan")}</button>)}
      </div>
      <div role="tabpanel" id="account-panel-profile" aria-labelledby="account-tab-profile" hidden={profileTab !== "profile"}>
      {editingPhoto && <ProfilePhotoEditor photo={photo} name={user.name} onSave={onSavePhoto} onClose={() => setEditingPhoto(false)}/>}
      <section className="card account-profile" aria-label={t(`Profil ${user.name}`)}>
        <div className="profile-card-heading">
          <span className="profile-card-icon"><Icon name="users" size={22}/></span>
          <div><h2>{t("Informasi akun &amp; profil")}</h2><p>{t("Kelola foto profil dan lihat informasi akun Anda.")}</p></div>
          <Badge tone="demo">{t("Akun demo")}</Badge>
        </div>
        <div className="account-profile-identity">
          <div className="profile-photo-container">
            <img className="profile-photo" src={photo} alt={t(`Foto profil ${user.name}`)} width={104} height={104}/>
            <button className="profile-photo-camera" type="button" aria-label={t("Edit foto profil")} title={t("Edit foto profil")} onClick={() => setEditingPhoto(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 3 6 6H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2l-2-3H8Zm4 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
            </button>
          </div>
          <div className="profile-photo-info">
            <h3>{t(user.name)}</h3>
            <p>{t(user.email)}</p>
            <button className="profile-photo-link" type="button" onClick={() => setEditingPhoto(true)}>{t("Pilih Avatar / Upload Foto")}</button>
            <small className="profile-photo-hint">{t("Mendukung JPG, PNG, dan WEBP")}</small>
          </div>
        </div>
        <div className="account-profile-details">
          <h3>{t("Informasi pribadi")}</h3>
          <dl>
            <div><dt>{t("Nama lengkap")}</dt><dd>{t(user.name)}</dd></div>
            <div><dt>{t("Email")}</dt><dd>{t(user.email)}</dd></div>
            <div><dt>{t("Peran")}</dt><dd>{t(user.role)}</dd></div>
            <div><dt>{t("Lokasi")}</dt><dd>{t("Gymnasyum Bintaro")}</dd></div>
          </dl>
          <div className="account-profile-footer">
            <div>
              <p className="account-profile-note">{t("Anda menggunakan profil demo untuk mencoba Smart Follow-up.")}</p>
              {saveMessage && <p className={saveFailed ? "account-save-error" : "account-save-success"} role={saveFailed ? "alert" : "status"}>{t(saveMessage)}</p>}
            </div>
            <Button onClick={saveAccountData}>{t("Simpan Data Akun")}</Button>
          </div>
        </div>
      </section>
      </div>
      <div role="tabpanel" id="account-panel-security" aria-labelledby="account-tab-security" hidden={profileTab !== "security"}>
        {profileTab === "security" && <AccountSecurity demoPassword={demoPassword}/>}
      </div>
    </>);
}
