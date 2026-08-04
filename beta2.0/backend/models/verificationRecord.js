const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VerificationRecord = sequelize.define('verification_record', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  instrument_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  instrument_code: DataTypes.STRING,
  instrument_name: DataTypes.STRING,
  result: DataTypes.STRING,
  verification_info: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  verification_date: DataTypes.DATEONLY,
  next_verification_date: DataTypes.DATEONLY,
  certificate_file: DataTypes.STRING,
  certificate_name: DataTypes.STRING,
  created_by: DataTypes.STRING
}, {
  tableName: 'verification_record',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['instrument_id'] }
  ]
});

module.exports = VerificationRecord;
