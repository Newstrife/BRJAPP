const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditLogController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'auditor'));

// 只提供查询接口，刻意不提供新增/修改/删除
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);

module.exports = router;
