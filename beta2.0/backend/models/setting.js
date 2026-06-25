const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Setting = sequelize.define('setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: DataTypes.TEXT
}, {
  tableName: 'setting',
  underscored: true,
  timestamps: true
});

module.exports = Setting;
