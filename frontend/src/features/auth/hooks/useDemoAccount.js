import { useState } from 'react';
import { demoAccounts } from '../services/demoAccounts.js';

export function useDemoAccount() {
  const [account, setAccount] = useState(() => {
    try {
      const saved = sessionStorage.getItem('gymnasyum-demo-login');
      const disabled = JSON.parse(localStorage.getItem('gymnasyum-disabled-accounts') || '[]');
      return (
        demoAccounts.find(
          (user) =>
            !disabled.includes(user.email) &&
            (user.email === saved || (saved === 'active' && user === demoAccounts[0])),
        ) ?? null
      );
    } catch {
      return null;
    }
  });
  const setLoginSession = (user) => {
    setAccount(user);
    try {
      if (user) sessionStorage.setItem('gymnasyum-demo-login', user.email);
      else sessionStorage.removeItem('gymnasyum-demo-login');
    } catch {
      /* The demo remains usable when browser storage is unavailable. */
    }
  };
  return { account, setLoginSession };
}
