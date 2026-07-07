const express = require('express');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/calibrationRecordController');

fs.mkdirSync('uploads/certificates', { recursive: true });
const upload = multer({ dest: 'uploads/certificates/' });

router.get('/', ctrl.list);
router.post('/', upload.single('certificate'), ctrl.create);
router.put('/:id', upload.single('certificate'), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
