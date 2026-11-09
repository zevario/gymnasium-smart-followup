import { useEffect, useState } from 'react';
import { api, hasSession } from '../../../shared/api/pilotApi.js';

export function usePilotSession() {
  const [identity, setIdentity] = useState(null);
  const [restoring, setRestoring] = useState(hasSession);

  useEffect(() => {
    let active = true;
    const endSession = () => setIdentity(null);
    window.addEventListener('pilot-session-ended', endSession);

    if (hasSession()) {
      api('/session')
        .then(({ user }) => {
          if (active) setIdentity(user);
        })
        // Failed restoration returns the user to the login screen.
        .catch(() => {})
        .finally(() => {
          if (active) setRestoring(false);
        });
    }

    return () => {
      active = false;
      window.removeEventListener('pilot-session-ended', endSession);
    };
  }, []);

  return { identity, setIdentity, restoring };
}
