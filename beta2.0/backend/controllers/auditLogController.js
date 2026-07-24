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

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 200);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    success(res, { total: count, list: rows, page, pageSize });
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
