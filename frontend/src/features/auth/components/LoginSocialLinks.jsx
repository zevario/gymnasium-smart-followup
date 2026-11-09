import { website, whatsapp } from '../data/loginContent.js';

export function LoginSocialLinks() {
  return (
    <div className="login-socials">
      <a
        href="https://www.instagram.com/gymnasyum.id/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram Gymnasyum"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp Gymnasyum">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 3h4l2 5-3 2q2 5 7 7l2-3 5 2v4q0 2-3 1Q4 18 2 6q0-3 2-3z" />
        </svg>
      </a>
      <a href={website} target="_blank" rel="noreferrer" aria-label="Website Gymnasyum">
        <svg
          aria-hidden="true"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0 M2 12h20 M12 2q-9 10 0 20 9-10 0-20" />
        </svg>
      </a>
    </div>
  );
}
