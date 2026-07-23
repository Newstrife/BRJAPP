const { Op } = require('sequelize');
const AuditLog = require('../models/auditLog');
const { success, fail } = require('../utils/response');

const like = (value) => ({ [Op.like]: `%${value}%` });

exports.list = async (req, res) => {
  try {
    const where = {};

    if (req.query.module) where.module = req.query.module;
    if (req.query.action) where.action = req.query.action;
    if (req.query.keyword) where.target_label = like(req.query.keyword);

    if (req.query.actor) {
      where[Op.or] = [
        { actor_username: like(req.query.actor) },
        { actor_nickname: like(req.query.actor) }
      ];
    }

    if (req.query.start || req.query.end) {
      where.createdAt = {};
      if (req.query.start) where.createdAt[Op.gte] = new Date(`${req.query.start}T00:00:00`);
      if (req.query.end) where.createdAt[Op.lte] = new Date(`${req.query.end}T23:59:59`);
    }

    const data = await AuditLog.findAll({
      where,
      order: [['id', 'DESC']],
      limit: 500
    });

    success(res, data);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.detail = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);

    if (!log) return fail(res, '日志不存在');

    success(res, log);
  } catch (err) {
    fail(res, err.message);
  }
};
