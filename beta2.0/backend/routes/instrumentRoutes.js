const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/instrumentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.post('/', requireAdmin, ctrl.create);
router.get('/', ctrl.list);
router.get('/export', requireAdmin, ctrl.exportExcel);
router.post('/check-calibration', ctrl.checkCalibration);
router.post('/import', requireAdmin, upload.single('file'), ctrl.importExcel);
router.put('/:id', requireAdmin, ctrl.update);
router.put('/:id/calibration', ctrl.updateCalibration);
router.post('/:id/use', ctrl.useDevice);
router.post('/:id/return', ctrl.returnDevice);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
