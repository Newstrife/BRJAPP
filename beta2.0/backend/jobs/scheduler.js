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
    const targetLabel = `${item.code || ''} ${item.name || ''}`.trim();

    // 计量到期检查
    if (item.next_calibration_date) {
      const diff = daysUntil(item.next_calibration_date);
      const reminderDate = dateOnly(item.next_calibration_date);

      if (diff < 0) {
        item.calibration_status = 'expired';
        item.locked = true;
        item.lock_reason = '计量超期';
        await item.save();

        await audit.record(null, {
          module: 'instrument',
          action: 'lock',
          targetId: item.id,
          targetLabel,
          detail: { reason: '计量超期，自动锁定', next_calibration_date: reminderDate }
        });
      } else if (diff <= 10) {
        if (item.calibration_status !== 'due_soon') {
          item.calibration_status = 'due_soon';
          await item.save();
        }

        if (item.calibration_reminder_for_date !== reminderDate) {
          try {
            await wecom.sendMessage(
              `【计量到期提醒】设备名称：${item.name || '-'}，设备编号：${item.code || '-'}，计量到期日期：${reminderDate}，剩余 ${diff} 天，请及时安排计量。`
            );
            item.calibration_reminder_for_date = reminderDate;
            await item.save();
          } catch (err) {
            console.error('企业微信发送失败:', err.message);
          }
        }
      }
    }

    // 验证到期检查（仅校准方式为"计量+验证"的设备）
    if (item.calibration_mode === 'calibration_verification' && item.next_verification_date) {
      const diff = daysUntil(item.next_verification_date);
      const reminderDate = dateOnly(item.next_verification_date);

      if (diff < 0) {
        if (!item.locked) {
          item.locked = true;
          item.lock_reason = '验证超期';
          await item.save();

          await audit.record(null, {
            module: 'instrument',
            action: 'lock',
            targetId: item.id,
            targetLabel,
            detail: { reason: '验证超期，自动锁定', next_verification_date: reminderDate }
          });
        }
      } else if (diff <= 10 && item.verification_reminder_for_date !== reminderDate) {
        try {
          await wecom.sendMessage(
            `【验证到期提醒】设备名称：${item.name || '-'}，设备编号：${item.code || '-'}，验证到期日期：${reminderDate}，剩余 ${diff} 天，请及时安排验证。`
          );
          item.verification_reminder_for_date = reminderDate;
          await item.save();
        } catch (err) {
          console.error('企业微信发送失败:', err.message);
        }
      }
    }
  }
};

cron.schedule('0 9 * * *', checkCalibrationDates, {
  timezone: 'Asia/Shanghai'
});

exports.checkCalibrationDates = checkCalibrationDates;
