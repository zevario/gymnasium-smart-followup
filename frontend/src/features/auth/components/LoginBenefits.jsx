import { benefits } from '../data/loginContent.js';

export function LoginBenefits({ t }) {
  return (
    <div className="login-benefits">
      {benefits.map(([title, description]) => (
        <article className="login-benefit" key={title}>
          <h2>
            <span className="login-benefit-letter" aria-hidden="true">
              {t(title).charAt(0)}
            </span>
            {t(title)}
          </h2>
          <p>{t(description)}</p>
        </article>
      ))}
    </div>
  );
}
