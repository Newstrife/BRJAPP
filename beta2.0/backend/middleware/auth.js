exports.requireAdmin = (req, res, next) => {
  if (req.headers['x-user-name'] !== 'admin') {
    return res.status(403).json({ code: 403, message: '仅管理员可操作' });
  }

  next();
};
