const fieldConfig = require('../services/fieldConfigService');
const audit = require('../services/auditService');
const { success, fail } = require('../utils/response');

exports.getInstrument = async (req, res) => {
  try {
    const fields = await fieldConfig.getFieldConfig();
    const reminderDays = await fieldConfig.getReminderDays();
    success(res, { fields, reminder_days: reminderDays });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.saveInstrument = async (req, res) => {
  try {
    const required = await fieldConfig.saveRequiredFields(req.body.required);
    const reminderDays = await fieldConfig.saveReminderDays(req.body.reminder_days);

    await audit.record(req, {
      module: 'instrument',
      action: 'field_config',
      targetLabel: '设备表单配置',
      detail: { required, reminder_days: reminderDays }
    });

    success(res, { fields: await fieldConfig.getFieldConfig(), reminder_days: reminderDays });
  } catch (err) {
    fail(res, err.message);
  }
};
