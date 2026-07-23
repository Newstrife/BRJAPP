const { Op } = require('sequelize');
const CalibrationRecord = require('../models/calibrationRecord');
const Instrument = require('../models/instrument');
const { success, fail } = require('../utils/response');
const audit = require('../services/auditService');

const currentUser = (req) => ({
  username: req.user?.username || '',
  nickname: req.user?.nickname || ''
});

const requireAdmin = (req, res) => {
  if (req.user?.role === 'admin') return true;
  fail(res, '仅管理员可以操作计量记录');
  return false;
};

const like = value => ({ [Op.like]: `%${value}%` });

exports.list = async (req, res) => {
  try {
    const where = {};

    if (req.query.instrument_id) where.instrument_id = req.query.instrument_id;
    if (req.query.instrument_code) where.instrument_code = like(req.query.instrument_code);
    if (req.query.instrument_name) where.instrument_name = like(req.query.instrument_name);
    if (req.query.result) where.result = req.query.result;

    const data = await CalibrationRecord.findAll({
      where,
      order: [['calibration_date', 'DESC'], ['id', 'DESC']]
    });

    success(res, data);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    if (!req.body.calibration_info) return fail(res, '请填写计量信息');

    const instrument = await Instrument.findByPk(req.body.instrument_id);
    if (!instrument) return fail(res, '设备不存在');

    const user = currentUser(req);
    const record = await CalibrationRecord.create({
      instrument_id: instrument.id,
      instrument_code: instrument.code,
      instrument_name: instrument.name,
      result: req.body.result,
      calibration_info: req.body.calibration_info,
      calibration_date: req.body.calibration_date,
      next_calibration_date: req.body.next_calibration_date,
      certificate_file: req.file ? req.file.path : '',
      certificate_name: req.file ? req.file.originalname : '',
      created_by: user.nickname || user.username
    });

    const calibrationStatus = req.body.result === '不合格' ? 'failed' : 'normal';
    await instrument.update({
      calibration_result: req.body.result,
      last_calibration_date: req.body.calibration_date,
      next_calibration_date: req.body.next_calibration_date,
      calibration_status: calibrationStatus,
      calibration_reminder_for_date: null,
      locked: calibrationStatus === 'failed',
      lock_reason: calibrationStatus === 'failed' ? '校准不合格' : null
    });

    await audit.record(req, {
      module: 'calibration',
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
    if (!req.body.calibration_info) return fail(res, '请填写计量信息');

    const record = await CalibrationRecord.findByPk(req.params.id);
    if (!record) return fail(res, '计量记录不存在');

    const before = record.toJSON();

    const instrument = await Instrument.findByPk(req.body.instrument_id || record.instrument_id);
    if (!instrument) return fail(res, '设备不存在');

    const nextData = {
      instrument_id: instrument.id,
      instrument_code: instrument.code,
      instrument_name: instrument.name,
      result: req.body.result,
      calibration_info: req.body.calibration_info,
      calibration_date: req.body.calibration_date,
      next_calibration_date: req.body.next_calibration_date
    };

    if (req.file) {
      nextData.certificate_file = req.file.path;
      nextData.certificate_name = req.file.originalname;
    }

    await record.update(nextData);

    const calibrationStatus = record.result === '不合格' ? 'failed' : 'normal';
    await instrument.update({
      calibration_result: record.result,
      last_calibration_date: record.calibration_date,
      next_calibration_date: record.next_calibration_date,
      calibration_status: calibrationStatus,
      calibration_reminder_for_date: null,
      locked: calibrationStatus === 'failed',
      lock_reason: calibrationStatus === 'failed' ? '校准不合格' : null
    });

    await audit.record(req, {
      module: 'calibration',
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

    const record = await CalibrationRecord.findByPk(req.params.id);
    if (!record) return fail(res, '计量记录不存在');

    const snapshot = record.toJSON();

    await record.destroy();

    await audit.record(req, {
      module: 'calibration',
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
