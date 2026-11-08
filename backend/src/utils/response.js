const response = {
  success(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  },

  error(res, message, statusCode = 400) {
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  },
};

export default response;