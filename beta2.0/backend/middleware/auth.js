const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'brjapp-dev-secret-change-me';
const TOKEN_EXPIRES_IN = '12h';

const unauthorized = (res) =>
  res.status(401).json({ code: 401, message: '未登录或登录已过期' });

exports.requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return unauthorized(res);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    unauthorized(res);
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '仅管理员可操作' });
  }

  next();
};

exports.signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
