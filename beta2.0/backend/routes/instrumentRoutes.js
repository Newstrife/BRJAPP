const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/instrumentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/export', ctrl.exportExcel);
router.post('/check-calibration', ctrl.checkCalibration);
router.post('/import', upload.single('file'), ctrl.importExcel);
router.put('/:id', ctrl.update);
router.put('/:id/calibration', ctrl.updateCalibration);
router.post('/:id/use', ctrl.useDevice);
router.post('/:id/return', ctrl.returnDevice);
router.delete('/:id', ctrl.remove);

module.exports = router;
