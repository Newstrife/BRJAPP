const XLSX = require('xlsx');

const fieldMap = {
  code: ['code', '设备编号', '编号'],
  name: ['name', '设备名称', '名称'],
  model: ['model', '型号规格', '型号'],
  manufacturer: ['manufacturer', '厂家', '制造商'],
  purchase_date: ['purchase_date', '入库日期', '购买日期'],
  location: ['location', '存放位置', '房间号', '位置'],
  department: ['department', '所属部门', '部门'],
  owner: ['owner', '责任人'],
  borrower: ['borrower', '当前领用人', '领用人'],
  status: ['status', '使用状态', '状态'],
  usage_notes: ['usage_notes', '仪器使用注意事项', '使用注意事项', '注意事项'],
  asset_code: ['asset_code', '固定资产编号', '资产编号'],
  calibration_status: ['calibration_status', '计量状态', '验证状态'],
  calibration_result: ['calibration_result', '计量结果', '校准结果'],
  calibration_note: ['calibration_note', '计量说明', '校准说明'],
  last_calibration_date: ['last_calibration_date', '本次计量时间', '本次校准日期'],
  next_calibration_date: ['next_calibration_date', '下次计量时间', '下次校准日期', '下次验证日期']
};

const pickValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }

  return undefined;
};

const normalizeDate = value => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  return String(value).slice(0, 10);
};

const normalizeStatus = value => {
  const map = {
    空闲: 'idle',
    已领用: 'in_use',
    使用中: 'in_use',
    维修中: 'repair',
    报废: 'scrapped'
  };

  return map[value] || value || 'idle';
};

const normalizeCalibrationStatus = value => {
  const map = {
    未校准: 'uncalibrated',
    正常: 'normal',
    合格: 'normal',
    即将到期: 'due_soon',
    已过期: 'expired',
    校准不合格: 'failed',
    不合格: 'failed',
    校验失败: 'failed',
    验证失败: 'failed'
  };

  return map[value] || value || 'uncalibrated';
};

exports.parseExcel = filePath => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  return rows
    .map(row => {
      const item = {};

      for (const [field, keys] of Object.entries(fieldMap)) {
        item[field] = pickValue(row, keys);
      }

      item.purchase_date = normalizeDate(item.purchase_date);
      item.last_calibration_date = normalizeDate(item.last_calibration_date);
      item.next_calibration_date = normalizeDate(item.next_calibration_date);
      item.status = normalizeStatus(item.status);
      item.calibration_status = normalizeCalibrationStatus(item.calibration_status || item.calibration_result);

      return item;
    })
    .filter(item => item.code || item.name);
};

exports.exportExcel = (data, res) => {
  const ws = XLSX.utils.json_to_sheet(data.map(item => item.toJSON ? item.toJSON() : item));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '设备');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=devices.xlsx');
  res.end(buffer);
};
