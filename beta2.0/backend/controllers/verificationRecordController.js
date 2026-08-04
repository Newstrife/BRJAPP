const { Op } = require('sequelize');
const VerificationRecord = require('../models/verificationRecord');
const Instrument = require('../models/instrument');
const { success, fail } = require('../utils/response');
const audit = require('../services/auditService');
const instrumentService = require('../services/instrumentService');

const currentUser = (req) => ({
  username: req.user?.username || '',
  nickname: req.user?.nickname || ''
});

const requireAdmin = (req, res) => {
  if (req.user?.role === 'admin') return true;
  fail(res, '仅管理员可以操作验证记录');
  return false;
};

const like = value => ({ [Op.like]: `%${value}%` });

// 验证结果映射为枚举并联动设备状态
const applyToInstrument = async (instrument, record) => {
  const verification = record.result === '不合格'
    ? 'failed'
    : record.result === '合格'
      ? 'passed'
      : instrument.verification_result;

  const { status, lockReason } = instrumentService.resolveCalibrationStatus(
    instrument.calibration_result,
    instrument.calibration_mode || 'calibration',
    verification
  );

  await instrument.update({
    verification_result: verification,
    next_verification_date: record.next_verification_date,
    verification_reminder_for_date: null,
    calibration_status: status,
    calibration_reminder_for_date: null,
    locked: status === 'failed',
    lock_reason: lockReason
  });
};

exports.list = async (req, res) => {
  try {
    const where = {};

    if (req.query.instrument_id) where.instrument_id = req.query.instrument_id;
    if (req.query.instrument_code) where.instrument_code = like(req.query.instrument_code);
    if (req.query.instrument_name) where.instrument_name = like(req.query.instrument_name);
    if (req.query.result) where.result = req.query.result;

    const data = await VerificationRecord.findAll({
      where,
      order: [['verification_date', 'DESC'], ['id', 'DESC']]
    });

    success(res, data);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    if (!req.body.verification_info) return fail(res, '请填写验证信息');

    const instrument = await Instrument.findByPk(req.body.instrument_id);
    if (!instrument) return fail(res, '设备不存在');

    const user = currentUser(req);
    const record = await VerificationRecord.create({
      instrument_id: instrument.id,
      instrument_code: instrument.code,
      instrument_name: instrument.name,
      result: req.body.result,
      verification_info: req.body.verification_info,
      verification_date: req.body.verification_date,
      next_verification_date: req.body.next_verification_date,
      certificate_file: req.file ? req.file.path : '',
      certificate_name: req.file ? req.file.originalname : '',
      created_by: user.nickname || user.username
    });

    await applyToInstrument(instrument, record);

    await audit.record(req, {
      module: 'verification',
      action: 'create',
      targetId: record.id,
      targetLabel: `${record.instrument_code || ''} ${record.instrument_name || ''}`.trim(),
      detail: record.toJSON()
    });

    success(res, record);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    if (!req.body.verification_info) return fail(res, '请填写验证信息');

    const record = await VerificationRecord.findByPk(req.params.id);
    if (!record) return fail(res, '验证记录不存在');

    const instrument = await Instrument.findByPk(req.body.instrument_id || record.instrument_id);
    if (!instrument) return fail(res, '设备不存在');

    const before = record.toJSON();

    const nextData = {
      instrument_id: instrument.id,
      instrument_code: instrument.code,
      instrument_name: instrument.name,
      result: req.body.result,
      verification_info: req.body.verification_info,
      verification_date: req.body.verification_date,
      next_verification_date: req.body.next_verification_date
    };

    if (req.file) {
      nextData.certificate_file = req.file.path;
      nextData.certificate_name = req.file.originalname;
    }

    await record.update(nextData);
    await applyToInstrument(instrument, record);

    await audit.record(req, {
      module: 'verification',
      action: 'update',
      targetId: record.id,
      targetLabel: `${record.instrument_code || ''} ${record.instrument_name || ''}`.trim(),
      detail: { before, after: record.toJSON() }
    });

    success(res, record);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const record = await VerificationRecord.findByPk(req.params.id);
    if (!record) return fail(res, '验证记录不存在');

    const snapshot = record.toJSON();

    await record.destroy();

    await audit.record(req, {
      module: 'verification',
      action: 'remove',
      targetId: snapshot.id,
      targetLabel: `${snapshot.instrument_code || ''} ${snapshot.instrument_name || ''}`.trim(),
      detail: snapshot
    });

    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};
