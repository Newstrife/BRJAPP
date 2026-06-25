const { Op } = require('sequelize');
const Instrument = require('../models/instrument');

exports.create = (data) => Instrument.create(data);

exports.list = async (query = {}) => {
  const where = {};

  if (query.name) {
    where.name = { [Op.like]: `%${query.name}%` };
  }

  return Instrument.findAll({ where });
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
