export function activationDeliveryMessage(payload) {
  return payload.delivery === 'waiting-for-sender'
    ? 'Permintaan diterima, tetapi layanan pengirim email belum siap. Hubungi petugas Gymnasyum.'
    : 'Permintaan pengiriman ulang diterima. Periksa kotak masuk dan folder spam. Pengiriman dapat memerlukan beberapa saat.';
}

export async function resendActivation(email, send = fetch) {
  const response = await send('/api/auth/resend-activation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.data !== true)
    throw new Error(payload.message || 'Email aktivasi belum dapat diminta ulang.');
  return activationDeliveryMessage(payload);
}
