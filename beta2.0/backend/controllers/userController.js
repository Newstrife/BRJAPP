const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { success, fail } = require('../utils/response');
const audit = require('../services/auditService');

const isBcryptHash = (value) => /^\$2[aby]\$/.test(value || '');

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  nickname: user.nickname,
  role: user.role
});

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
      password: await bcrypt.hash(password, 10),
      role: role || 'user'
    });

    await audit.record(req, {
      module: 'user',
      action: 'create',
      targetId: user.id,
      targetLabel: user.username,
      detail: publicUser(user)
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
      nextData.password = await bcrypt.hash(req.body.password, 10);
    }

    const before = { ...publicUser(user), password_changed: Boolean(req.body.password) };

    await user.update(nextData);

    await audit.record(req, {
      module: 'user',
      action: 'update',
      targetId: user.id,
      targetLabel: user.username,
      detail: { before, after: publicUser(user) }
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

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return fail(res, '账号不存在');
    if (user.username === 'admin') return fail(res, '不能删除默认管理员账号');
    if (req.user.username === user.username) return fail(res, '不能删除当前登录账号');

    const snapshot = publicUser(user);

    await user.destroy();

    await audit.record(req, {
      module: 'user',
      action: 'remove',
      targetId: snapshot.id,
      targetLabel: snapshot.username,
      detail: snapshot
    });

    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.user.username } });

    if (!user) return fail(res, '账号不存在');
    if (!req.body.oldPassword || !req.body.newPassword) return fail(res, '请输入原密码和新密码');

    const oldPasswordOk = isBcryptHash(user.password)
      ? await bcrypt.compare(req.body.oldPassword, user.password)
      : user.password === req.body.oldPassword;

    if (!oldPasswordOk) return fail(res, '原密码不正确');

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();

    await audit.record(req, {
      module: 'user',
      action: 'password',
      targetId: user.id,
      targetLabel: user.username
    });

    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};
