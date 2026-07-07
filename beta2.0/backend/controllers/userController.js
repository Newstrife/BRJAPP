const User = require('../models/user');
const { success, fail } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nickname', 'role', 'createdAt'],
      order: [['id', 'ASC']]
    });

    success(res, users.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      role: user.role,
      createdAt: user.createdAt
    })));
  } catch (err) {
    fail(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { username, nickname, password, role } = req.body;

    if (!username || !password) return fail(res, '请输入账号和密码');

    const user = await User.create({
      username,
      nickname: nickname || username,
      password,
      role: role || 'user'
    });

    success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return fail(res, '账号不存在');

    const nextData = {
      nickname: req.body.nickname || user.username,
      role: req.body.role || user.role
    };

    if (req.body.password) {
      nextData.password = req.body.password;
    }

    await user.update(nextData);

    success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return fail(res, '账号不存在');
    if (user.username === 'admin') return fail(res, '不能删除默认管理员账号');
    if (req.headers['x-user-name'] === user.username) return fail(res, '不能删除当前登录账号');

    await user.destroy();
    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const username = req.headers['x-user-name'];
    const user = await User.findOne({ where: { username } });

    if (!user) return fail(res, '账号不存在');
    if (!req.body.oldPassword || !req.body.newPassword) return fail(res, '请输入原密码和新密码');
    if (user.password !== req.body.oldPassword) return fail(res, '原密码不正确');

    user.password = req.body.newPassword;
    await user.save();

    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};
