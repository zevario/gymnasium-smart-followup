import { useRef, useState } from 'react';

export function useLoginForm(authenticate) {
  const passwordInput = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setError] = useState('');

  function changeEmail(value) {
    setError('');
    setEmail(value);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await authenticate(email, password, setError);
    } finally {
      setBusy(false);
    }
  }

  return {
    email,
    password,
    setPassword,
    passwordInput,
    showPassword,
    setShowPassword,
    busy,
    errorMessage,
    changeEmail,
    submit,
  };
}
