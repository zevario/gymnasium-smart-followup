const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);

  if (err.isJoi) {
    return res.status(400).json({
      status: 'error',
      message: err.details[0].message,
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      message: 'Data already exists',
    });
  }

  if (err.code === '23503' || err.code === '23514') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid related data or constraint violation',
    });
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
};

export default errorHandler;