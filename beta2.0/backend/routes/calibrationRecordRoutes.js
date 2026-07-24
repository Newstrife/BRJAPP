const express = require('express');
const fs = require('fs');
const router = express.Router();
const ctrl = require('../controllers/calibrationRecordController');
const { uploadSingle } = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');

fs.mkdirSync('uploads/certificates', { recursive: true });

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', requireAdmin, uploadSingle('certificate', 'uploads/certificates/', ['.pdf', '.jpg', '.jpeg', '.png']), ctrl.create);
router.put('/:id', requireAdmin, uploadSingle('certificate', 'uploads/certificates/', ['.pdf', '.jpg', '.jpeg', '.png']), ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
