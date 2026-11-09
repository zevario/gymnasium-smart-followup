export function createErrorHandler({ includeStatus = true } = {}) {
  return (err, req, res, next) => {
    const send = (code, message) =>
      res.status(code).json({ ...(includeStatus ? { status: 'error' } : {}), message });
    if (res.headersSent) return next(err);
    if (err.isJoi) return send(400, err.details[0].message);
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
      return send(401, 'Invalid or expired token');
    }
    if (err.code === '23505') return send(409, 'Data already exists');
    if (['23503', '23514', '22P02'].includes(err.code)) {
      return send(400, 'Invalid related data or input');
    }
    if (err.type === 'entity.parse.failed') return send(400, 'Invalid JSON body');
    if (err.type === 'entity.too.large') return send(413, 'Request body too large');
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
