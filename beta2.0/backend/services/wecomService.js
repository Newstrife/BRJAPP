const axios = require('axios');
const Setting = require('../models/setting');

const WEBHOOK_KEY = 'wecom_webhook';
const WECOM_WEBHOOK_PREFIX = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=';

const normalizeWebhook = (value = '') => {
  const webhook = String(value).trim();

  if (!webhook) return '';
  if (/^https?:\/\//i.test(webhook)) return webhook;

  return `${WECOM_WEBHOOK_PREFIX}${webhook}`;
};

exports.getWebhook = async () => {
  const setting = await Setting.findByPk(WEBHOOK_KEY);
  return setting?.value || '';
};

exports.saveWebhook = async (webhook) => {
  const value = normalizeWebhook(webhook);
  const [setting] = await Setting.findOrCreate({
    where: { key: WEBHOOK_KEY },
    defaults: { value }
  });

  if (setting.value !== value) {
    setting.value = value;
    await setting.save();
  }

  return setting.value;
};

exports.sendMessage = async (text, webhookOverride) => {
  const webhook = normalizeWebhook(webhookOverride) || await exports.getWebhook();

  if (!webhook) {
    throw new Error('请先设置企业微信机器人 Webhook 地址');
  }

  if (!webhook.includes('qyapi.weixin.qq.com/cgi-bin/webhook/send?key=')) {
    throw new Error('Webhook 地址格式不正确，请使用企业微信机器人完整 Webhook 地址或 key');
  }

  try {
    const response = await axios.post(
      webhook,
      {
        msgtype: 'text',
        text: {
          content: text
        }
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.errcode !== 0) {
      throw new Error(response.data?.errmsg || '企业微信返回发送失败');
    }

    return response.data;
  } catch (err) {
    const message = err.response?.data?.errmsg || err.response?.data?.message || err.message;
    throw new Error(`企业微信发送失败：${message}`);
  }
};
