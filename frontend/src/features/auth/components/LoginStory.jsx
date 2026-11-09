import { LoginContactDetails } from './LoginContactDetails.jsx';
import { LoginSiteLinks } from './LoginSiteLinks.jsx';
import { LoginBenefits } from './LoginBenefits.jsx';
import { website } from '../data/loginContent.js';
import slide1 from '../../../assets/images/login-slide-1.png';
import slide2 from '../../../assets/images/login-slide-2.png';
import slide3 from '../../../assets/images/login-slide-3.png';
import logo from '../../../assets/images/gymnasyum-logo.png';

export function LoginStory({ t }) {
  return (
    <section className="login-story" aria-labelledby="login-brand-title">
      <div className="login-photos" aria-hidden="true">
        {[slide1, slide2, slide3].map((slide) => (
          <img key={slide} src={slide} alt="" />
        ))}
      </div>
      <header className="login-story-header">
        <a className="login-brand" href={website} target="_blank" rel="noreferrer">
          <img src={logo} alt="" />
          <span id="login-brand-title">GYMNASYUM</span>
        </a>
        <p className="login-tagline">{t('Sehat dan kuat, dunia akhirat.')}</p>
      </header>
      <LoginBenefits t={t} />
      <footer className="login-story-footer">
        <LoginSiteLinks t={t} />
        <LoginContactDetails />
      </footer>
    </section>
  );
}
