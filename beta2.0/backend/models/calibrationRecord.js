const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CalibrationRecord = sequelize.define('calibration_record', {
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
  calibration_info: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  calibration_date: DataTypes.DATEONLY,
  next_calibration_date: DataTypes.DATEONLY,
  certificate_file: DataTypes.STRING,
  certificate_name: DataTypes.STRING,
  created_by: DataTypes.STRING
}, {
  tableName: 'calibration_record',
  underscored: true,
  timestamps: true
});

module.exports = CalibrationRecord;
