const Setting = require('../models/setting');

const SETTING_KEY = 'instrument_required_fields';
const REMINDER_DAYS_KEY = 'calibration_reminder_days';
const DEFAULT_REMINDER_DAYS = 10;

// 可配置必填的字段（下拉枚举字段有默认值，不参与必填配置）
// fixed: 系统固定必填，不允许关闭（设备编号依赖唯一性校验）
const FIELD_DEFS = [
  { key: 'code', label: '设备编号', fixed: true },
  { key: 'name', label: '设备名称' },
  { key: 'model', label: '型号规格' },
  { key: 'manufacturer', label: '厂家' },
  { key: 'purchase_date', label: '入库日期' },
  { key: 'location', label: '存放位置' },
  { key: 'department', label: '所属部门' },
  { key: 'owner', label: '责任人' },
  { key: 'asset_code', label: '固定资产编号' },
  { key: 'usage_notes', label: '仪器使用注意事项' },
  { key: 'calibration_result', label: '计量结果' },
  { key: 'last_calibration_date', label: '本次计量时间' },
  { key: 'next_calibration_date', label: '下次计量时间' },
  { key: 'next_verification_date', label: '下次验证日期' },
  { key: 'calibration_note', label: '计量说明' }
];

const FIXED_REQUIRED = FIELD_DEFS.filter(f => f.fixed).map(f => f.key);

// 未配置时的默认必填字段（与原表单硬编码规则保持一致）
const DEFAULT_REQUIRED = [
  'code',
  'name',
  'model',
  'manufacturer',
  'purchase_date',
  'location',
  'department',
  'owner',
  'asset_code'
];

const KNOWN_KEYS = FIELD_DEFS.map(f => f.key);

const getRequiredFields = async () => {
  try {
    const row = await Setting.findByPk(SETTING_KEY);
    if (row && row.value) {
      const keys = JSON.parse(row.value);
      if (Array.isArray(keys)) {
        return [...new Set([...keys.filter(k => KNOWN_KEYS.includes(k)), ...FIXED_REQUIRED])];
      }
    }
  } catch (err) {
    // 配置缺失或损坏时回退默认值
  }
  return DEFAULT_REQUIRED;
};

const getFieldConfig = async () => {
  const required = await getRequiredFields();
  return FIELD_DEFS.map(f => ({ ...f, required: required.includes(f.key) }));
};

const saveRequiredFields = async (keys) => {
  const list = [
    ...new Set([...(Array.isArray(keys) ? keys : []).filter(k => KNOWN_KEYS.includes(k)), ...FIXED_REQUIRED])
  ];

  const [row] = await Setting.findOrCreate({
    where: { key: SETTING_KEY },
    defaults: { value: JSON.stringify(list) }
  });
  row.value = JSON.stringify(list);
  await row.save();

  return list;
};

const isEmpty = value =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

// 到期提醒天数（即将到期/提醒的窗口），未配置时默认 10 天
const getReminderDays = async () => {
  try {
    const row = await Setting.findByPk(REMINDER_DAYS_KEY);
    const days = parseInt(row && row.value, 10);
    if (Number.isInteger(days) && days >= 1 && days <= 365) return days;
  } catch (err) {
    // 配置缺失或损坏时回退默认值
  }
  return DEFAULT_REMINDER_DAYS;
};

const saveReminderDays = async (days) => {
  const value = parseInt(days, 10);
  if (!Number.isInteger(value) || value < 1 || value > 365) {
    throw new Error('提醒天数需为 1-365 之间的整数');
  }

  const [row] = await Setting.findOrCreate({
    where: { key: REMINDER_DAYS_KEY },
    defaults: { value: String(value) }
  });
  row.value = String(value);
  await row.save();

  return value;
};

// 服务端按配置校验必填字段，返回错误消息（通过时返回 null）
const validatePayload = async (body) => {
  const required = await getRequiredFields();
  const labels = Object.fromEntries(FIELD_DEFS.map(f => [f.key, f.label]));
  const missing = required.filter(k => isEmpty(body[k])).map(k => labels[k] || k);
  return missing.length ? `请填写必填字段：${missing.join('、')}` : null;
};

module.exports = {
  FIELD_DEFS,
  getRequiredFields,
  getFieldConfig,
  saveRequiredFields,
  getReminderDays,
  saveReminderDays,
  validatePayload
};
