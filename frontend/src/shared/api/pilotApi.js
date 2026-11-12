import { clearSession, hasSession, readSession, saveSession } from './session.js';

export { hasSession };

let refreshing;

async function request(path, method, body, token) {
  const response = await fetch('/api' + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({ message: 'Backend belum tersedia.' }));
  if (!response.ok || !Object.hasOwn(result, 'data'))
    throw Object.assign(new Error(result.message || 'Permintaan gagal.'), {
      status: response.status,
    });
  return result.data;
}

export async function login(email, password) {
  const result = await request('/auth/login', 'POST', { email: email.trim(), password });
  saveSession(result);
  try {
    return (await api('/session')).user;
  } catch (error) {
    await logout().catch(() => {});
    throw error;
  }
}

async function renew(session) {
  try {
    const data = await request('/auth/refresh', 'POST', { refreshToken: session.refreshToken });
    // Only persist when nobody else replaced the session while we were refreshing.
    if (readSession()?.refreshToken === session.refreshToken) saveSession(data);
  } catch (error) {
    if (
      [400, 401, 403].includes(error.status) &&
      readSession()?.refreshToken === session.refreshToken
    ) {
      clearSession();
      window.dispatchEvent(new Event('pilot-session-ended'));
    }
    throw error;
  }
}

export async function api(path, method = 'GET', body) {
  const session = readSession();
  try {
    return await request(path, method, body, session?.accessToken);
  } catch (error) {
    if (error.status !== 401 || !session) throw error;
    // Concurrent 401s share one refresh request.
    if (readSession()?.accessToken === session.accessToken) {
      refreshing ??= renew(session).finally(() => {
        refreshing = null;
      });
      await refreshing;
    }
    return request(path, method, body, readSession()?.accessToken);
  }
}

export async function logout() {
  const session = readSession();
  clearSession();
  if (session)
    await request(
      '/auth/logout',
      'POST',
      { refreshToken: session.refreshToken },
      session.accessToken,
    );
}
