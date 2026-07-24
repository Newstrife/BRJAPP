const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('audit_log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  actor_username: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'system'
  },
  actor_nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_id: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  target_label: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  detail: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  ip: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, {
  tableName: 'audit_log',
  underscored: true,
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['module'] },
    { fields: ['action'] },
    { fields: ['created_at'] }
  ]
});

// 审计日志只允许新增，任何修改/删除都直接拒绝
const immutable = () => {
  throw new Error('审计日志不允许修改或删除');
};

AuditLog.beforeUpdate(immutable);
AuditLog.beforeDestroy(immutable);
AuditLog.beforeBulkUpdate(immutable);
AuditLog.beforeBulkDestroy(immutable);

module.exports = AuditLog;
