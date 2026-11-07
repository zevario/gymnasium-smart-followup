const authorization = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission',
    });
  }

  next();
};

export default authorization;