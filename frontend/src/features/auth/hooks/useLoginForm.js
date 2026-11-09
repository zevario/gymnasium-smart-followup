import { useRef, useState } from 'react';

export function useLoginForm(authenticate, demoPassword) {
  const passwordInput = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setError] = useState('');

  function changeEmail(value) {
    setDemo(false);
    setEmail(value);
    setShowAccounts(false);
  }

  function selectDemoAccount(user) {
    setDemo(true);
    setEmail(user.email);
    setPassword(demoPassword);
    setError('');
    setShowAccounts(false);
    passwordInput.current?.focus();
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await authenticate(email, password, setError, demo);
    } finally {
      setBusy(false);
    }
  }

  return {
    email,
    password,
    setPassword,
    passwordInput,
    showAccounts,
    setShowAccounts,
    showPassword,
    setShowPassword,
    busy,
    errorMessage,
    changeEmail,
    selectDemoAccount,
    submit,
  };
}
