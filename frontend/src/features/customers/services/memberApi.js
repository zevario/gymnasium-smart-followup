export const sessionKey = 'gymnasyum-member-session';
export async function request(path, method = 'GET', body) {
  const token = sessionStorage.getItem(sessionKey);
  const res = await fetch('/api/members/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res
    .json()
    .catch(() => ({ message: 'Layanan belum tersedia. Silakan coba lagi.' }));
  if (!res.ok) {
    if (res.status === 401 && path !== 'login') {
      sessionStorage.removeItem(sessionKey);
      location.reload();
    }
    throw Object.assign(
      new Error(
        json.message ||
          (res.status === 409
            ? 'Data sudah tercatat. Periksa email atau permintaan yang masih menunggu.'
            : 'Layanan belum tersedia. Silakan coba lagi.'),
      ),
      { code: json.code },
    );
  }
  return json.data;
}

export async function loginMember(email, password) {
  const { token } = await request('login', 'POST', { email, password });
  sessionStorage.setItem(sessionKey, token);
}
