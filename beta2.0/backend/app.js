const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const sequelize = require('./config/db');
const User = require('./models/user');
const scheduler = require('./jobs/scheduler');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wecom', require('./routes/wecomRoutes'));
app.use('/wecom', require('./routes/wecomRoutes'));
app.use('/api/instruments', require('./routes/instrumentRoutes'));
app.use('/api/calibration-records', require('./routes/calibrationRecordRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));

const distDir = path.join(__dirname, '..', 'frontend', 'device-ui', 'dist');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  // SPA 回退：非接口/上传文件的 GET 请求统一交给前端页面
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();

    res.sendFile(path.join(distDir, 'index.html'));
  });
}

sequelize.sync({ alter: true }).then(async () => {
  const [admin] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      nickname: '管理员',
      password: await bcrypt.hash('123456', 10),
      role: 'admin'
    }
  });

  if (!admin.nickname) {
    admin.nickname = '管理员';
    await admin.save();
  }

  scheduler.checkCalibrationDates();
  app.listen(3000, '0.0.0.0', () => console.log('服务启动 3000'));
});
