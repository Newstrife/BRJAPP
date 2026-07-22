const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/wecomController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/setting', requireAdmin, ctrl.getSetting);
router.post('/setting', requireAdmin, ctrl.saveSetting);
router.post('/test', requireAdmin, ctrl.test);

module.exports = router;
