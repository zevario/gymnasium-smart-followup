export const openWhatsApp = (phone, message) => {
  if (!phone) {
    alert('Nomor WhatsApp pelanggan belum tersedia.');
    return;
  }

  // Mengubah nomor Indonesia menjadi format internasional.
  let formattedPhone = String(phone).replace(/\D/g, '');

  if (formattedPhone.startsWith('0')) {
    formattedPhone = `62${formattedPhone.slice(1)}`;
  } else if (formattedPhone.startsWith('8')) {
    formattedPhone = `62${formattedPhone}`;
  }

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank', 'noopener,noreferrer');
};