const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

router.put('/me/password', ctrl.changePassword);
router.get('/', requireAdmin, ctrl.list);
router.post('/', requireAdmin, ctrl.create);
router.put('/:id', requireAdmin, ctrl.update);

module.exports = router;
