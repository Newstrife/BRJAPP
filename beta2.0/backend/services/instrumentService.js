const { Op } = require('sequelize');
const Instrument = require('../models/instrument');

const like = (value) => ({ [Op.like]: `%${value}%` });

const buildWhere = (query = {}) => {
  const where = {};

  if (query.code) where.code = like(query.code);
  if (query.name) where.name = like(query.name);
  if (query.status) where.status = query.status;
  if (query.calibration_status) where.calibration_status = query.calibration_status;
  if (query.usage_notes) where.usage_notes = like(query.usage_notes);
  if (query.location) where.location = like(query.location);
  if (query.department) where.department = like(query.department);

  if (query.keyword) {
    where[Op.or] = [
      { code: like(query.keyword) },
      { name: like(query.keyword) },
      { location: like(query.keyword) }
    ];
  }

  return where;
};

exports.create = (data) => Instrument.create(data);

exports.list = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 20, 1), 500);

  const { count, rows } = await Instrument.findAndCountAll({
    where: buildWhere(query),
    order: [['id', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return { total: count, list: rows, page, pageSize };
};

// 导出等场景使用：不分页，返回全部
exports.listAll = (query = {}) =>
  Instrument.findAll({
    where: buildWhere(query),
    order: [['id', 'DESC']]
  });

exports.use = async (id) => {
  const inst = await Instrument.findByPk(id);

  if (!inst) throw new Error('设备不存在');
  if (inst.locked) throw new Error(inst.lock_reason || '设备已锁定');
  if (['expired', 'failed'].includes(inst.calibration_status)) throw new Error('计量异常');
  if (inst.status !== 'idle') throw new Error('设备不可用');

  inst.status = 'in_use';
  await inst.save();
};
