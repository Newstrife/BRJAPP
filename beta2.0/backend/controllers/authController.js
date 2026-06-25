const User = require('../models/user');
const { success, fail } = require('../utils/response');

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });

    if (!user || user.password !== req.body.password) {
      return fail(res, '账号或密码错误');
    }

    success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      role: user.role,
      token: `local-${Date.now()}`
    });
  } catch (err) {
    fail(res, err.message);
  }
};
