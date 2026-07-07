const { Op } = require('sequelize');
const Instrument = require('../models/instrument');

const like = (value) => ({ [Op.like]: `%${value}%` });

exports.create = (data) => Instrument.create(data);

exports.list = async (query = {}) => {
  const where = {};

  if (query.code) where.code = like(query.code);
  if (query.name) where.name = like(query.name);
  if (query.status) where.status = query.status;
  if (query.usage_notes) where.usage_notes = like(query.usage_notes);
  if (query.location) where.location = like(query.location);
  if (query.department) where.department = like(query.department);

  return Instrument.findAll({
    where,
    order: [['id', 'DESC']]
  });
};

exports.use = async (id) => {
  const inst = await Instrument.findByPk(id);

  if (!inst) throw new Error('设备不存在');
  if (inst.locked) throw new Error(inst.lock_reason || '设备已锁定');
  if (['expired', 'failed'].includes(inst.calibration_status)) throw new Error('计量异常');
  if (inst.status !== 'idle') throw new Error('设备不可用');

  inst.status = 'in_use';
  await inst.save();
};
