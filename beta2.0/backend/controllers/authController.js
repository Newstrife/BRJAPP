const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { success, fail } = require('../utils/response');
const { signToken } = require('../middleware/auth');

const isBcryptHash = (value) => /^\$2[aby]\$/.test(value || '');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) return fail(res, '账号或密码错误');

    let passwordOk;

    if (isBcryptHash(user.password)) {
      passwordOk = await bcrypt.compare(password || '', user.password);
    } else {
      // 兼容升级前的明文密码：校验通过后立即改写为哈希
      passwordOk = user.password === (password || '');

      if (passwordOk) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!passwordOk) return fail(res, '账号或密码错误');

    success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      role: user.role,
      token: signToken(user)
    });
  } catch (err) {
    fail(res, err.message);
  }
};
