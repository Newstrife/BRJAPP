const express = require('express');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/calibrationRecordController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

fs.mkdirSync('uploads/certificates', { recursive: true });
const upload = multer({ dest: 'uploads/certificates/' });

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', requireAdmin, upload.single('certificate'), ctrl.create);
router.put('/:id', requireAdmin, upload.single('certificate'), ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
