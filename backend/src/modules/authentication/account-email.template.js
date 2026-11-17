const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

// Sent to the current address when a customer asks to move the account to another email.
export function changeEmailNoticeText({ name, newEmail }) {
  return [
    name ? 'Halo ' + name + ',' : 'Halo,',
    'Ada permintaan untuk mengganti email akun Gymnasyum Anda menjadi ' + newEmail + '.',
    'Email akun belum berubah sampai tautan yang dikirim ke alamat baru dikonfirmasi.',
    'Jika Anda tidak mengajukan perubahan ini, segera ganti kata sandi akun Anda dan hubungi petugas Gymnasyum.',
    'Salam, Tim Gymnasyum',
    'Email otomatis. Mohon tidak membalas email ini.',
  ].join('\n\n');
}

export function accountEmailTemplate({ name, purpose, url }) {
  const reset = purpose === 'reset';
  const change = purpose === 'change-email';
  const title = reset
    ? 'Atur ulang kata sandi Anda'
    : change
      ? 'Konfirmasikan email baru Anda'
      : 'Selamat datang di Gymnasyum';
  const action = reset ? 'Reset Password' : change ? 'Konfirmasi Email Baru' : 'Aktifkan Akun Saya';
  const intro = reset
    ? 'Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Pilih tombol berikut untuk membuat kata sandi baru.'
    : change
      ? 'Konfirmasikan alamat email baru untuk memperbarui email akun Gymnasyum Anda.'
      : 'Akun Anda telah dibuat. Konfirmasikan alamat email Anda untuk mulai mengakses jadwal, paket latihan, dan layanan Gymnasyum.';
  const duration = reset ? '30 menit' : '24 jam';
  const greeting = name ? 'Halo ' + name + ',' : 'Halo,';
  const text = [
    title,
    greeting,
    intro,
    action,
    url,
    'Tautan berlaku ' + duration + ' dan hanya dapat digunakan sekali.',
    'Jika Anda tidak mengajukan permintaan ini, abaikan email ini.',
    'Salam, Tim Gymnasyum',
    'Email otomatis. Mohon tidak membalas email ini.',
  ].join('\n\n');
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f1;color:#222b20;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${escape(intro)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce4d5;border-radius:20px">
<tr><td style="padding:28px 28px 24px;border-bottom:1px solid #e3e9de">
<img src="cid:gymnasyum-logo" width="44" height="44" alt="Logo Gymnasyum" style="display:block;margin-bottom:14px">
<strong style="font-size:22px;letter-spacing:2px">GYMNASYUM</strong><br><span style="font-size:11px;letter-spacing:2px;color:#64735f">SMART FOLLOW-UP SYSTEM</span>
</td></tr>
<tr><td style="padding:32px 28px">
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.3;color:#456b15">${escape(title)}</h1>
<p style="font-size:15px;line-height:1.7;margin:0 0 16px">${escape(greeting)}</p>
<p style="font-size:15px;line-height:1.7;margin:0 0 24px">${escape(intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#456b15" style="border-radius:12px">
<a href="${escape(url)}" style="display:block;padding:17px 20px;color:#ffffff;font-size:16px;line-height:24px;font-weight:bold;text-decoration:none">${escape(action)}</a>
</td></tr></table>
<p style="margin:20px 0 24px;padding:14px;background:#eff4e8;border-radius:10px;font-size:13px;line-height:1.7;color:#53634c">Tautan berlaku <strong>${duration}</strong> dan hanya dapat digunakan sekali.</p>
<p style="font-size:13px;line-height:1.7;color:#64735f">Jika tombol belum dapat dibuka, salin tautan berikut ke browser Anda.</p>
<p style="font-size:12px;line-height:1.8;word-break:break-all;overflow-wrap:anywhere"><a href="${escape(url)}" style="color:#456b15">${escape(url)}</a></p>
<p style="margin:24px 0;font-size:13px;line-height:1.7;color:#64735f">Jika Anda tidak mengajukan permintaan ini, abaikan email ini.</p>
<p style="margin:0;font-size:14px;line-height:1.7">Salam,<br><strong>Tim Gymnasyum</strong></p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e3e9de;font-size:12px;line-height:1.8;color:#64735f">Email otomatis. Mohon tidak membalas email ini.<br>© ${new Date().getFullYear()} Gymnasyum · Bintaro</td></tr>
</table></td></tr></table></body></html>`;
  return { html, text };
}
