import { website, whatsapp } from '../data/loginContent.js';

export function LoginContactDetails() {
  return (
    <address>
      <a href={`${website}/location`} target="_blank" rel="noreferrer">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z M14 10a2 2 0 1 1-4 0 2 2 0 1 1 4 0" />
        </svg>
        <span>Ruko Kebayoran Square A12, Bintaro, Tangerang Selatan, 15227, Banten</span>
      </a>
      <a href={whatsapp} target="_blank" rel="noreferrer">
        <svg
          aria-hidden="true"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 3h4l2 5-3 2q2 5 7 7l2-3 5 2v4q0 2-3 1Q4 18 2 6q0-3 2-3z" />
        </svg>
        <span>+62 812 8642 5888</span>
      </a>
    </address>
  );
}
