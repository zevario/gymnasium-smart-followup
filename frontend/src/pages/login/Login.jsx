import slide1 from "../../assets/images/login-slide-1.png"
import slide2 from "../../assets/images/login-slide-2.png"
import slide3 from "../../assets/images/login-slide-3.png"
import logo from "../../assets/images/gymnasyum-logo.png"
import { useLanguage } from "../../i18n/useLanguage.js";
import { useRef, useState } from "react";
import "./Login.css";
const english = {
    "Kelas": "Classes",
    "Sehat dan kuat, dunia akhirat.": "Healthy and strong, in this life and the hereafter.",
    "Dasar yang kuat, progres yang nyata": "Strong foundations, real progress",
    "Pelajari teknik dasar latihan beban untuk membangun tubuh yang lebih sehat dan kuat.": "Learn the fundamentals of weight training for a healthier, stronger body.",
    "Didampingi coach profesional": "Guided by professional coaches",
    "Berlatih bersama coach profesional bersertifikat untuk membantu mencapai tujuan kebugaran Anda.": "Train with certified professional coaches to help reach your fitness goals.",
    "Tumbuh bersama komunitas": "Grow with a community",
    "Tempat berlatih, bertumbuh, dan saling mendukung dalam perjalanan hidup yang lebih sehat.": "A place to train, grow, and support each other on the journey to a healthier life.",
    "Latihan sesuai tujuan Anda": "Training for your goals",
    "Temukan pilihan kelas dan paket latihan yang sesuai dengan kebutuhan kebugaran Anda.": "Find classes and training packages that fit your fitness needs.",
    "Lebih mudah, lebih terencana": "Easier to plan, easier to train",
    "Jelajahi jadwal latihan, pilih kelas, dan mulai kebiasaan baik bersama Gymnasyum.": "Explore training schedules, choose a class, and build healthy habits with Gymnasyum.",
    "Tautan Gymnasyum": "Gymnasyum links",
    "Harga Paket": "Packages",
    "Jadwal Latihan": "Training Schedule",
    "Masukkan kata sandi Anda": "Enter your password",
    "Tidak bisa masuk?": "Having trouble signing in?",
    "Hubungi tim Gymnasyum": "Contact the Gymnasyum team",
    "Kata sandi": "Password",
    "Sembunyikan": "Hide",
    "Lihat": "Show",
    "Memproses...": "Processing...",
    "Masuk": "Sign in",
    "Bahasa": "Language",
    "Email": "Email",
    "Jadwal": "Schedule",
    "Paket": "Plan",
    "WhatsApp": "WhatsApp",
    "SMART FOLLOW-UP": "SMART FOLLOW-UP",
    "Pilih akun demo": "Choose demo account",
    "Ubah tema": "Switch theme",
    "Email atau kata sandi tidak sesuai. Gunakan akun demo di bawah.": "Incorrect email or password. Choose a demo account below.",
    "Akun demo ini dinonaktifkan. Hubungi Administrator Sistem.": "This demo account is disabled. Contact the system administrator."
};
const benefits = [
    ['Dasar yang kuat, progres yang nyata', 'Pelajari teknik dasar latihan beban untuk membangun tubuh yang lebih sehat dan kuat.'],
    ['Didampingi coach profesional', 'Berlatih bersama coach profesional bersertifikat untuk membantu mencapai tujuan kebugaran Anda.'],
    ['Tumbuh bersama komunitas', 'Tempat berlatih, bertumbuh, dan saling mendukung dalam perjalanan hidup yang lebih sehat.'],
    ['Latihan sesuai tujuan Anda', 'Temukan pilihan kelas dan paket latihan yang sesuai dengan kebutuhan kebugaran Anda.'],
    ['Lebih mudah, lebih terencana', 'Jelajahi jadwal latihan, pilih kelas, dan mulai kebiasaan baik bersama Gymnasyum.'],
];
const website = 'https://gymnasyum.id';
const whatsapp = 'https://wa.me/6281286425888';
function Login({ accounts, demoPassword, authenticate }) {
    const { language, setLanguage } = useLanguage();
    const [isDarkMode, setDark] = useState(false);
    const [errorMessage, setError] = useState("");
    const t = (key) => language === "en" ? english[key] ?? key : key;
    const passwordInput = useRef(null);
    const [showAccounts, setShowAccounts] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [demo,setDemo]=useState(false);
    const [busy,setBusy]=useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if(busy)return;
        setBusy(true);setError("");
        try{await authenticate(email,password,setError,demo);}finally{setBusy(false);}
    };
    return (<main className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <section className="login-story" aria-labelledby="login-brand-title">
        <div className="login-photos" aria-hidden="true">
          {[slide1, slide2, slide3].map(slide => <img key={slide} src={slide} alt=""/>)}
        </div>
        <header className="login-story-header">
          <a className="login-brand" href={website} target="_blank" rel="noreferrer">
            <img src={logo} alt=""/><span id="login-brand-title">GYMNASYUM</span>
          </a>
          <p className="login-tagline">{t('Sehat dan kuat, dunia akhirat.')}</p>
        </header>
        <div className="login-benefits">
          {benefits.map(([title, description]) => (<article className="login-benefit" key={title}>
              <h2><span className="login-benefit-letter" aria-hidden="true">{t(title).charAt(0)}</span>{t(title)}</h2>
              <p>{t(description)}</p>
            </article>))}
        </div>
        <footer className="login-story-footer">
          <nav aria-label={t('Tautan Gymnasyum')}>
            {[[website, 'Website'], [`${website}/class`, 'Kelas'], [`${website}/package`, 'Harga Paket'], [`${website}/timetable`, 'Jadwal Latihan']].map(([href, label]) => (<a key={href} href={href} target="_blank" rel="noreferrer">{t(label)}<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7 M7 7h10v10"/></svg></a>))}
          </nav>
          <address>
            <a href={`${website}/location`} target="_blank" rel="noreferrer"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z M14 10a2 2 0 1 1-4 0 2 2 0 1 1 4 0"/></svg><span>Ruko Kebayoran Square A12, Bintaro, Tangerang Selatan, 15227, Banten</span></a>
            <a href={whatsapp} target="_blank" rel="noreferrer"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 3h4l2 5-3 2q2 5 7 7l2-3 5 2v4q0 2-3 1Q4 18 2 6q0-3 2-3z"/></svg><span>+62 812 8642 5888</span></a>
          </address>
        </footer>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-inner">
          <div className="login-theme-toggle">
            <label className="language-switcher"><select aria-label="Language / Bahasa" value={language} onChange={e => setLanguage(e.target.value)}><option value="en">EN</option><option value="id">ID</option></select></label>
            <button type="button" className="theme-toggle" aria-label={t("Ubah tema")} onClick={() => setDark(!isDarkMode)}>{isDarkMode ? "☀" : "☾"}</button>
          </div>
          <div className="login-card">
            <header className="login-welcome">
              <img src={logo} alt="Gymnasyum" className="login-logo"/>
              <h1 id="login-title" className="login-system-name">GYMNASYUM<span>SMART FOLLOW-UP SYSTEM</span></h1>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="form-group email-picker" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget))
                setShowAccounts(false);
        }} onKeyDown={event => {
            if (event.key === "Escape") {
                event.currentTarget.querySelector("input")?.focus();
                setShowAccounts(false);
            }
        }}>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="off" required placeholder="nama@gymnasyum.id" value={email} onFocus={() => setShowAccounts(true)} onClick={() => setShowAccounts(true)} onChange={event => { setDemo(false);setEmail(event.target.value); setShowAccounts(false); }}/>
                {showAccounts && <div className="login-demos" role="group" aria-label={t("Pilih akun demo")}>
                  <small>{t("Pilih akun demo")}</small>
                  {accounts.map(user => <button type="button" key={user.email} onPointerDown={event => event.preventDefault()} onClick={() => {
                    setDemo(true);setEmail(user.email);
                    setPassword(demoPassword);
                    setError("");
                    setShowAccounts(false);
                    passwordInput.current?.focus();
                }}>
                    <strong>{user.name}</strong> · {user.role}
                    <small>{user.email}</small>
                  </button>)}
                </div>}
              </div>
              <div className="form-group">
                <label htmlFor="password">{t('Kata sandi')}</label>
                <div className="password-wrapper">
                  <input ref={passwordInput} id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={t('Masukkan kata sandi Anda')} value={password} onChange={(event) => setPassword(event.target.value)} required/>
                  <button type="button" className="toggle-password" aria-controls="password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? t('Sembunyikan') : t('Lihat')}</button>
                </div>
              </div>
              <div className="login-help"><span>{t('Tidak bisa masuk?')}</span><a href={whatsapp} target="_blank" rel="noreferrer">{t('Hubungi tim Gymnasyum')}<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7 M7 7h10v10"/></svg></a></div>
              {errorMessage && <p className="login-error" role="alert">{t(errorMessage)}</p>}
              <button type="submit" disabled={busy} className="login-button">{t('Masuk')}</button>
            </form>
          </div>
          <div className="login-socials">
            <a href="https://www.instagram.com/gymnasyum.id/" target="_blank" rel="noreferrer" aria-label="Instagram Gymnasyum"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg></a>
            <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp Gymnasyum"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 3h4l2 5-3 2q2 5 7 7l2-3 5 2v4q0 2-3 1Q4 18 2 6q0-3 2-3z"/></svg></a>
            <a href={website} target="_blank" rel="noreferrer" aria-label="Website Gymnasyum"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0 M2 12h20 M12 2q-9 10 0 20 9-10 0-20"/></svg></a>
          </div>
          <p className="login-copyright">© {new Date().getFullYear()} Gymnasyum · Grup DB15-G007</p>
        </div>
      </section>
    </main>);
}
export default Login;
