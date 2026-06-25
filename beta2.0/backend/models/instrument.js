const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instrument = sequelize.define('instrument', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  code: DataTypes.STRING,
  name: DataTypes.STRING,

  model: DataTypes.STRING,

  manufacturer: DataTypes.STRING,

  purchase_date: DataTypes.DATEONLY,

  location: DataTypes.STRING,

  department: DataTypes.STRING,

  owner: DataTypes.STRING,

  borrower: DataTypes.STRING,

  status: {
    type: DataTypes.ENUM(
      'idle',
      'in_use',
      'repair',
      'scrapped'
    ),
    defaultValue: 'idle'
  },

  asset_code: DataTypes.STRING,

  calibration_status: {
    type: DataTypes.ENUM(
      'uncalibrated',
      'normal',
      'due_soon',
      'expired',
      'failed'
    ),
    defaultValue: 'uncalibrated'
  },

  next_calibration_date: DataTypes.DATEONLY,

  last_calibration_date: DataTypes.DATEONLY,

  calibration_result: DataTypes.STRING,

  calibration_note: DataTypes.TEXT,

  calibration_reminder_for_date: DataTypes.STRING,

  locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  lock_reason: DataTypes.STRING

}, {
  tableName: 'instrument',
  underscored: true,
  timestamps: true
});

module.exports = Instrument;
