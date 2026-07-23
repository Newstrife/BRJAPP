const cron = require('node-cron');
const Instrument = require('../models/instrument');
const wecom = require('../services/wecomService');
const audit = require('../services/auditService');

const dateOnly = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

const daysUntil = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / 86400000);
};

const checkCalibrationDates = async () => {
  const list = await Instrument.findAll();

  for (const item of list) {
    if (!item.next_calibration_date) continue;

    const diff = daysUntil(item.next_calibration_date);
    const reminderDate = dateOnly(item.next_calibration_date);

    if (diff < 0) {
      item.calibration_status = 'expired';
      item.locked = true;
      item.lock_reason = '超期';
      await item.save();

      await audit.record(null, {
        module: 'instrument',
        action: 'lock',
        targetId: item.id,
        targetLabel: `${item.code || ''} ${item.name || ''}`.trim(),
        detail: { reason: '校准超期，自动锁定', next_calibration_date: reminderDate }
      });
      continue;
    }

    if (diff <= 10) {
      if (item.calibration_status !== 'due_soon') {
        item.calibration_status = 'due_soon';
        await item.save();
      }

      if (item.calibration_reminder_for_date === reminderDate) continue;

      try {
        await wecom.sendMessage(`设备 ${item.name} 验证即将过期`);
        item.calibration_reminder_for_date = reminderDate;
        await item.save();
      } catch (err) {
        console.error('企业微信发送失败:', err.message);
      }
    }
  }
};

cron.schedule('0 9 * * *', checkCalibrationDates, {
  timezone: 'Asia/Shanghai'
});

exports.checkCalibrationDates = checkCalibrationDates;
