const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/db');
const User = require('./models/user');
const scheduler = require('./jobs/scheduler');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wecom', require('./routes/wecomRoutes'));
app.use('/wecom', require('./routes/wecomRoutes'));
app.use('/api/instruments', require('./routes/instrumentRoutes'));

sequelize.sync({ alter: true }).then(async () => {
  const [admin] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: { nickname: '管理员', password: '123456', role: 'admin' }
  });

  if (!admin.nickname) {
    admin.nickname = '管理员';
    await admin.save();
  }

  scheduler.checkCalibrationDates();
  app.listen(3000, '0.0.0.0', () => console.log('服务启动 3000'));
});
