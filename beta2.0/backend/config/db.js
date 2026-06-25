const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'device_db',
  'root',
  'brj.123',
  {
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;