const key = 'gymnasyum-pilot-session';
const read = () => JSON.parse(sessionStorage.getItem(key) || 'null');
export const hasSession = () => !!sessionStorage.getItem(key);
const save = (data) =>
  sessionStorage.setItem(
    key,
    JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }),
  );
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
  save(result);
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
    if (read()?.refreshToken === session.refreshToken) save(data);
  } catch (error) {
    if ([400, 401, 403].includes(error.status) && read()?.refreshToken === session.refreshToken) {
      sessionStorage.removeItem(key);
      window.dispatchEvent(new Event('pilot-session-ended'));
    }
    throw error;
  }
}
export async function api(path, method = 'GET', body) {
  const session = read();
  try {
    return await request(path, method, body, session?.accessToken);
  } catch (error) {
    if (error.status !== 401 || !session) throw error;
    if (read()?.accessToken === session.accessToken) {
      refreshing ??= renew(session).finally(() => {
        refreshing = null;
      });
      await refreshing;
    }
    return request(path, method, body, read()?.accessToken);
  }
}
export async function logout() {
  const session = read();
  sessionStorage.removeItem(key);
  if (session)
    await request(
      '/auth/logout',
      'POST',
      { refreshToken: session.refreshToken },
      session.accessToken,
    );
}
export const roles = {
  staff: 'Admin/CS & Sales',
  spv: 'Supervisor / Manajer Operasional',
  admin: 'Administrator Sistem',
};
export function displayUser(user) {
  return {
    ...user,
    live: true,
    roleCode: user.role,
    role: roles[user.role],
    initials: user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join(''),
  };
}
export const dateTime = (time) =>
  time
    ? new Date(time).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' WIB'
    : '—';
