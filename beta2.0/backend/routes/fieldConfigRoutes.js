const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fieldConfigController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/instrument', ctrl.getInstrument);
router.put('/instrument', requireAdmin, ctrl.saveInstrument);

module.exports = router;
