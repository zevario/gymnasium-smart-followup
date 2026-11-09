import { website } from '../data/loginContent.js';

export function LoginSiteLinks({ t }) {
  return (
    <nav aria-label={t('Tautan Gymnasyum')}>
      {[
        [website, 'Website'],
        [`${website}/class`, 'Kelas'],
        [`${website}/package`, 'Harga Paket'],
        [`${website}/timetable`, 'Jadwal Latihan'],
      ].map(([href, label]) => (
        <a key={href} href={href} target="_blank" rel="noreferrer">
          {t(label)}
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M7 17 17 7 M7 7h10v10" />
          </svg>
        </a>
      ))}
    </nav>
  );
}
