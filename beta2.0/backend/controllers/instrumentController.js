const service = require('../services/instrumentService');
const excel = require('../services/excelService');
const { success, fail } = require('../utils/response');
const Instrument = require('../models/instrument');
const scheduler = require('../jobs/scheduler');

const buildInstrumentPayload = (body) => ({
  code: body.code,
  name: body.name,
  model: body.model,
  manufacturer: body.manufacturer,
  purchase_date: body.purchase_date,
  location: body.location,
  department: body.department,
  owner: body.owner,
  borrower: body.borrower,
  asset_code: body.asset_code,
  status: body.status,
  usage_notes: body.usage_notes,
  calibration_status: body.calibration_status,
  calibration_result: body.calibration_result,
  calibration_note: body.calibration_note,
  last_calibration_date: body.last_calibration_date,
  next_calibration_date: body.next_calibration_date,
  locked: body.locked,
  lock_reason: body.lock_reason
});

const currentUser = (req) => {
  const nickname = req.headers['x-user-nickname']
    ? decodeURIComponent(req.headers['x-user-nickname'])
    : '';

  return {
    username: req.headers['x-user-name'] || '',
    nickname
  };
};

const isAdmin = (req) => currentUser(req).username === 'admin';
const requireAdmin = (req, res) => {
  if (isAdmin(req)) return true;
  fail(res, '仅管理员可以操作');
  return false;
};

exports.create = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const instrument = await Instrument.create(buildInstrumentPayload(req.body));
    success(res, instrument);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const device = await Instrument.findByPk(req.params.id);

    if (!device) return fail(res, '设备不存在');

    await device.update(buildInstrumentPayload(req.body));
    success(res, device);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const device = await Instrument.findByPk(req.params.id);

    if (!device) return fail(res, '设备不存在');

    await device.destroy();
    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.updateCalibration = async (req, res) => {
  try {
    const device = await Instrument.findByPk(req.params.id);

    if (!device) return fail(res, '设备不存在');

    const result = req.body.calibration_result || '';
    const calibrationStatus = result === '不合格' ? 'failed' : 'normal';

    await device.update({
      calibration_result: result,
      calibration_note: req.body.calibration_note,
      last_calibration_date: req.body.last_calibration_date,
      next_calibration_date: req.body.next_calibration_date,
      calibration_status: calibrationStatus,
      calibration_reminder_for_date: null,
      locked: calibrationStatus === 'failed',
      lock_reason: calibrationStatus === 'failed' ? '校准不合格' : null
    });

    success(res, device);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.useDevice = async (req, res) => {
  try {
    const device = await Instrument.findByPk(req.params.id);
    const user = currentUser(req);
    const borrower = req.body.borrower || req.body.user || user.nickname || user.username || '未知用户';

    if (!device) return fail(res, '设备不存在');
    if (device.calibration_status === 'uncalibrated') return fail(res, '设备未校准，限制使用');
    if (device.calibration_status === 'failed') return fail(res, '设备校准不合格，限制使用');
    if (device.locked) return fail(res, device.lock_reason || '设备已锁定');
    if (device.status !== 'idle') return fail(res, `设备已被 ${device.borrower || '其他用户'} 领用`);

    await device.update({
      status: 'in_use',
      borrower
    });
    success(res, device);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.returnDevice = async (req, res) => {
  try {
    const device = await Instrument.findByPk(req.params.id);
    const user = currentUser(req);

    if (!device) return fail(res, '设备不存在');
    if (device.status !== 'in_use') return fail(res, '设备当前未被领用');

    const borrower = device.borrower || '';
    const isOwner = borrower && [user.nickname, user.username].filter(Boolean).includes(borrower);

    if (!isOwner && !isAdmin(req)) {
      return fail(res, `该设备由 ${borrower || '其他用户'} 领用，非本人不能归还`);
    }

    await device.update({
      status: 'idle',
      borrower: null
    });
    success(res, device);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.list = async (req, res) => {
  try {
    const data = await service.list(req.query);
    success(res, data);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.importExcel = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    if (!req.file) return fail(res, '请上传文件');

    const data = excel.parseExcel(req.file.path);
    const rows = await Instrument.bulkCreate(data);
    success(res, {
      imported: rows.length,
      list: rows
    });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.exportExcel = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const data = await service.list(req.query);
    excel.exportExcel(data, res);
  } catch (err) {
    fail(res, err.message);
  }
};

exports.checkCalibration = async (req, res) => {
  try {
    await scheduler.checkCalibrationDates();
    success(res, null);
  } catch (err) {
    fail(res, err.message);
  }
};
