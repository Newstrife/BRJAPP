const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'auditor'),
    defaultValue: 'user'
  }
}, {
  tableName: 'user',
  underscored: true,
  timestamps: true
});

module.exports = User;
