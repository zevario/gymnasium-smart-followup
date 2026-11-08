import { useT } from "./i18n/useLanguage.js"
import { useState, useEffect } from "react"
import { initialCustomers } from "./features/customers/data/demoCustomers.js"
import { demoAccounts, accountRoles, demoPassword, authenticateDemo } from "./features/auth/services/demoAccounts.js"
import { canContact, todayQueue } from "./features/followups/services/followupRules.js"
import { isProfilePhoto, defaultProfilePhoto } from "./features/profile/utils/profilePhoto.js"
import { permissions, mayEditTask } from "./features/auth/services/access.js"
import { mayOpenPage } from "./routes/pageAccess.js"
import LoginPage from "./pages/login/Login.jsx"
import { AccountContext } from "./features/auth/context/AccountContext.js"
import { Sidebar } from "./layouts/Sidebar.jsx"
import { Header } from "./layouts/AppHeader.jsx"
import { Today } from "./pages/staff/Dashboard.jsx"
import { AllFollowups } from "./pages/staff/FollowUps.jsx"
import { Customers } from "./pages/staff/Customers.jsx"
import { Reports } from "./pages/spv/Reports.jsx"
import { SystemSettings } from "./pages/admin/SystemSettings.jsx"
import { Settings } from "./pages/spv/Settings.jsx"
import { Profile } from "./pages/Profile.jsx"
import { DetailDrawer } from "./features/followups/components/FollowUpDetails.jsx"
import { Icon } from "./components/Controls/Controls.jsx"

import { api, hasSession, login, logout } from "./services/pilotApi.js"
import { PilotWorkspace } from "./layouts/PilotWorkspace.jsx"

export default function App() {
    const t = useT();
    const [identity,setIdentity]=useState(null);
    const [restoring,setRestoring]=useState(hasSession);
    useEffect(()=>{
        let active=true;
        const ended=()=>setIdentity(null);
        window.addEventListener("pilot-session-ended",ended);
        if(hasSession()) api('/session').then(data=>{if(active)setIdentity(data.user);})
            .catch(()=>{}).finally(()=>{if(active)setRestoring(false);});
        return ()=>{active=false;window.removeEventListener("pilot-session-ended",ended);};
    },[]);
    const [page, setPage] = useState("Dashboard");
    const [customers, setCustomers] = useState(initialCustomers);
    const [selected, setSelected] = useState(null);
    const [mobileNav, setMobileNav] = useState(() => window.matchMedia("(min-width: 769px)").matches);
    const [toast, setToast] = useState("");
    const [account, setAccount] = useState(() => {
        try {
            const saved = sessionStorage.getItem("gymnasyum-demo-login");
            const disabled = JSON.parse(localStorage.getItem("gymnasyum-disabled-accounts") || "[]");
            return demoAccounts.find((user) => !disabled.includes(user.email) && (user.email === saved || (saved === "active" && user === demoAccounts[0]))) ?? null;
        }
        catch {
            return null;
        }
    });
    const [profilePhotos, setProfilePhotos] = useState(() => {
        const photos = {};
        for (const user of demoAccounts) {
            try {
                const saved = localStorage.getItem(`gymnasyum-profile-photo-v1:${user.email}`);
                if (saved && isProfilePhoto(saved))
                    photos[user.email] = saved;
            }
            catch { /* The default avatar remains available without browser storage. */ }
        }
        return photos;
    });
    const profilePhoto = account ? profilePhotos[account.email] ?? defaultProfilePhoto : defaultProfilePhoto;
    const saveProfilePhoto = (photo) => {
        if (!account || !isProfilePhoto(photo))
            return;
        localStorage.setItem(`gymnasyum-profile-photo-v1:${account.email}`, photo);
        setProfilePhotos((previous) => ({ ...previous, [account.email]: photo }));
        notify("Foto profil berhasil diperbarui");
    };
    const currentUser = account ?? demoAccounts[0];
    const access = permissions(account);
    const activePage = mayOpenPage(account, page) ? page : access.system ? "Pengaturan" : "Dashboard";
    const setLoginSession = (user) => {
        setAccount(user);
        try {
            if (user)
                sessionStorage.setItem("gymnasyum-demo-login", user.email);
            else
                sessionStorage.removeItem("gymnasyum-demo-login");
        }
        catch { /* The demo remains usable when browser storage is unavailable. */ }
    };
    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 769px)");
        const syncSidebar = () => setMobileNav(desktop.matches);
        desktop.addEventListener("change", syncSidebar);
        return () => desktop.removeEventListener("change", syncSidebar);
    }, []);
    useEffect(() => {
        const escape = (e) => {
            if (e.key === "Escape") {
                setSelected(null);
                setMobileNav(false);
            }
        };
        window.addEventListener("keydown", escape);
        return () => window.removeEventListener("keydown", escape);
    }, []);
    useEffect(() => {
        document.querySelector(".main")?.scrollTo(0, 0);
        window.scrollTo(0, 0);
    }, [page]);
    const navigate = (p) => {
        if (!mayOpenPage(account, p))
            return;
        setPage(p);
        if (window.matchMedia("(max-width: 768px)").matches)
            setMobileNav(false);
        setSelected(null);
    };
    const updateCustomer = (id, patch) => {
        const apply = (c) => {
            const claiming = access.operational && c.owner === "Belum ditugaskan" && patch.owner === account?.name.split(" ")[0] && Object.keys(patch).every((key) => key === "owner");
            if (!claiming && !mayEditTask(account, c.owner))
                return c;
            if (patch.owner && !claiming && !access.supervisor)
                return c;
            if (patch.lastContact && !canContact(c))
                return c;
            return { ...c, ...patch };
        };
        setCustomers((c) => c.map((x) => (x.id === id ? apply(x) : x)));
        setSelected((s) => (s?.id === id ? apply(s) : s));
    };
    const notify = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(""), 3200);
    };
    if(restoring) return <p role="status">{t("Memuat sesi…")}</p>;
    if(identity) return <PilotWorkspace identity={identity} onLogout={()=>{logout().catch(()=>{});setIdentity(null);setLoginSession(null);}}/>;
    if (!account)
        return <LoginPage accounts={accountRoles.flatMap(role => demoAccounts.find(user => user.role === role) ?? [])} demoPassword={demoPassword}
            authenticate={async(email,password,setError,demo)=>{
                if(demo) {
                    if(hasSession()) await logout().catch(()=>{});
                    authenticateDemo(email,password,user=>{setLoginSession(user);setPage(permissions(user).system?"Pengaturan":"Dashboard");},setError);
                    return;
                }
                try{const user=await login(email,password);setLoginSession(null);setIdentity(user);}
                catch(e){setError(e.status===401?"Email atau kata sandi tidak sesuai.":e.message);}
            }}/>;
    return (<AccountContext.Provider value={account}>
    <div className={`app-shell ${mobileNav ? "sidebar-visible" : "sidebar-hidden"}`}>
      <Sidebar page={activePage} navigate={navigate} open={mobileNav} onToggle={() => setMobileNav((open) => !open)} count={todayQueue(customers).length} memberCount={customers.length} user={currentUser} onLogout={() => { setLoginSession(null); setSelected(null); setPage("Dashboard"); }}/>
      {mobileNav && (<button className="nav-backdrop" aria-label={t("Tutup navigasi")} onClick={() => setMobileNav(false)}/>)}
      <main className="main">
        <Header page={activePage} photo={profilePhoto} customers={customers} onOpenNotification={(customer) => { if (access.operational)
        setSelected(customer); }} account={account} onProfile={() => navigate("Profil")} onLogin={(user) => { setLoginSession(user); setPage(permissions(user).system ? "Pengaturan" : "Dashboard"); notify(`Berhasil masuk sebagai ${user.name}`); }} onLogout={() => { setLoginSession(null); navigate("Dashboard"); notify("Anda sudah keluar dari akun demo"); }}/>
        <div className={`content ${activePage === "Profil" ? "content-account" : ""}`}>
          {activePage === "Dashboard" && (<Today customers={customers} onOpen={(customer) => { if (access.operational)
            setSelected(customer); }} onAll={() => navigate("Semua follow-up")}/>)}
          {activePage === "Semua follow-up" && (<AllFollowups customers={customers} onOpen={(customer) => { if (access.operational)
            setSelected(customer); }}/>)}
          {activePage === "Pelanggan" && (<Customers customers={customers} onOpen={(customer) => { if (access.operational)
            setSelected(customer); }}/>)}
          {activePage === "Laporan" && <Reports />}
          {activePage === "Pengaturan" && (access.system ? <SystemSettings /> : <Settings notify={notify}/>)}
          {activePage === "Profil" && <Profile key={currentUser.email} user={currentUser} photo={profilePhoto} onSavePhoto={saveProfilePhoto}/>}
        </div>
      </main>
      {selected && access.operational && (<DetailDrawer customer={selected} onClose={() => setSelected(null)} update={updateCustomer} notify={notify}/>)}
      {toast && (<div className="toast">
          <span className="toast-icon">
            <Icon name="check" size={15}/>
          </span>
          {t(toast)}
        </div>)}
    </div>
    </AccountContext.Provider>);
}
