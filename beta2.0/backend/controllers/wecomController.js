const wecom = require('../services/wecomService');
const { success, fail } = require('../utils/response');

exports.getSetting = async (req, res) => {
  try {
    success(res, { webhook: await wecom.getWebhook() });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.saveSetting = async (req, res) => {
  try {
    const webhook = await wecom.saveWebhook(req.body.webhook || '');
    success(res, { webhook });
  } catch (err) {
    fail(res, err.message);
  }
};

exports.test = async (req, res) => {
  try {
    const webhook = await wecom.saveWebhook(req.body.webhook || '');
    const result = await wecom.sendMessage(req.body.message || '企业微信机器人测试消息', webhook);
    success(res, result);
  } catch (err) {
    fail(res, err.message);
  }
};
