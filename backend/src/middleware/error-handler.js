const fieldLabels = {
  name: 'Nama',
  email: 'Email',
  phone: 'Nomor telepon',
  password: 'Kata sandi',
  current: 'Kata sandi saat ini',
  currentPassword: 'Kata sandi saat ini',
  newPassword: 'Kata sandi baru',
  confirmPassword: 'Konfirmasi kata sandi',
  birth: 'Tanggal lahir',
  note: 'Catatan',
  message: 'Pesan',
  response: 'Jawaban',
  amount: 'Nominal',
  package: 'Nama paket',
  date: 'Tanggal',
  location: 'Lokasi',
  role: 'Peran',
};

// Joi's default messages are English and expose field paths ("records[0].location").
// Custom messages written in a schema do not start with a quote and pass through unchanged.
export function joiMessage({ message, type, path, context = {} }) {
  if (!message.startsWith('"')) return message;
  const label = fieldLabels[context.key] ?? 'Data';
  const row = path[0] === 'records' && Number.isInteger(path[1]) ? `Data ke-${path[1] + 1}: ` : '';
  const valids = context.valids ?? [];
  const text = {
    'any.required': `${label} wajib diisi.`,
    'string.empty': `${label} wajib diisi.`,
    'string.min': `${label} minimal ${context.limit} karakter.`,
    'string.max': `${label} maksimal ${context.limit} karakter.`,
    'string.email': 'Format email tidak valid.',
    'string.pattern.base': /password/i.test(context.key)
      ? `${label} harus memuat huruf besar dan huruf kecil.`
      : `Format ${label.toLowerCase()} tidak valid.`,
    'date.max': `${label} tidak boleh melewati hari ini.`,
    'any.only': valids.some((v) => typeof v === 'object')
      ? `${label} belum cocok.`
      : `${label} harus salah satu dari: ${valids.join(', ')}.`,
  }[type];
  return row + (text ?? `Periksa kembali ${label.toLowerCase()}.`);
}

export function createErrorHandler({ includeStatus = true } = {}) {
  return (err, req, res, next) => {
    const send = (code, message) =>
      res.status(code).json({ ...(includeStatus ? { status: 'error' } : {}), message });
    if (res.headersSent) return next(err);
    if (err.isJoi) return send(400, joiMessage(err.details[0]));
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
      return send(401, 'Invalid or expired token');
    }
    if (err.code === '23505') return send(409, 'Data sudah terdaftar.');
    if (['23503', '23514', '22P02'].includes(err.code)) {
      return send(400, 'Data tidak valid.');
    }
    if (err.type === 'entity.parse.failed') return send(400, 'Format data tidak valid.');
    if (err.type === 'entity.too.large') return send(413, 'Data terlalu besar.');
    const requested = err.statusCode || err.status;
    const status =
      Number.isInteger(requested) && requested >= 400 && requested < 600 ? requested : 500;
    // Do not log request bodies, credentials, tokens, or database error details.
    if (status >= 500) console.error('API error', err.code || err.name);
    return send(
      status,
      status >= 500 ? 'Layanan belum tersedia.' : err.message || 'Request rejected',
    );
  };
}

export default createErrorHandler();
