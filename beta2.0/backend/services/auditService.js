const AuditLog = require('../models/auditLog');

// req 可为空：为空时按系统任务记录（如定时校准检查）
exports.record = async (req, { module, action, targetId, targetLabel, detail }) => {
  try {
    await AuditLog.create({
      actor_username: req?.user?.username || 'system',
      actor_nickname: req?.user?.nickname || '系统任务',
      module,
      action,
      target_id: targetId != null ? String(targetId) : '',
      target_label: targetLabel || '',
      detail: detail ? JSON.stringify(detail) : '',
      ip: req?.ip || ''
    });
  } catch (err) {
    // 日志写失败不能影响主业务
    console.error('审计日志写入失败:', err.message);
  }
};
