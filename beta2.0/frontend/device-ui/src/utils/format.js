export const calibrationText = status => ({
  uncalibrated: '未校准',
  normal: '正常',
  due_soon: '即将到期',
  expired: '已过期',
  failed: '校准不合格'
}[status] || status)

export const calibrationTag = status => ({
  uncalibrated: 'info',
  normal: 'success',
  due_soon: 'warning',
  expired: 'danger',
  failed: 'danger'
}[status] || 'info')

export const deviceStatusText = status => ({
  idle: '空闲',
  in_use: '使用中',
  repair: '维修中',
  scrapped: '报废'
}[status] || status)

export const deviceStatusTag = status => ({
  idle: 'success',
  in_use: 'primary',
  repair: 'warning',
  scrapped: 'info'
}[status] || 'info')

export const roleLabel = role => ({
  admin: '管理员',
  auditor: '审计员',
  user: '普通用户'
}[role] || role)

export const auditModuleLabels = {
  instrument: '设备',
  calibration: '计量记录',
  user: '账号',
  wecom: '企业微信'
}

export const auditActionLabels = {
  create: '新增',
  update: '修改',
  remove: '删除',
  import: '导入',
  use: '领用',
  return: '归还',
  calibration: '校准',
  password: '修改密码',
  setting: '保存设置',
  lock: '自动锁定'
}

export const auditActionTagType = action => ({
  create: 'success',
  import: 'success',
  update: 'warning',
  calibration: 'warning',
  setting: 'warning',
  password: 'warning',
  remove: 'danger',
  lock: 'danger',
  use: 'primary',
  return: 'info'
}[action] || 'info')

export const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const formatTime = value => (value ? new Date(value).toLocaleString() : '-')
