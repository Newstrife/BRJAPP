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

// 计量/验证联动：校准方式为"计量+验证"时，计量结果与验证情况任一不合格即判定不合格
exports.resolveCalibrationStatus = (result, mode, verification) => {
  const resultFailed = result === '不合格';
  const verificationFailed = mode === 'calibration_verification' && verification === 'failed';

  if (resultFailed || verificationFailed) {
    return {
      status: 'failed',
      lockReason: verificationFailed ? '验证不合格' : '校准不合格'
    };
  }

  // "计量+验证"设备：计量合格但尚未验证 → 已计量未验证
  if (mode === 'calibration_verification' && result === '合格' && verification !== 'passed') {
    return { status: 'calibrated_unverified', lockReason: null };
  }

  return { status: 'normal', lockReason: null };
};

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
  if (inst.status !== 'normal') throw new Error('设备不可用');

  await inst.save();
};
