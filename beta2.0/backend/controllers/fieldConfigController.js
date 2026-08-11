const fieldConfig = require('../services/fieldConfigService');
const audit = require('../services/auditService');
const { success, fail } = require('../utils/response');

exports.getInstrument = async (req, res) => {
  try {
    success(res, await fieldConfig.getFieldConfig());
  } catch (err) {
    fail(res, err.message);
  }
};

exports.saveInstrument = async (req, res) => {
  try {
    const required = await fieldConfig.saveRequiredFields(req.body.required);

    await audit.record(req, {
      module: 'instrument',
      action: 'field_config',
      targetLabel: '设备表单必填配置',
      detail: { required }
    });

    success(res, await fieldConfig.getFieldConfig());
  } catch (err) {
    fail(res, err.message);
  }
};
