const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pickup.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth.ensureAuth, ctrl.createPickup);
router.get('/', auth.requireRole('admin'), ctrl.listPickups);

router.patch('/:id', auth.requireRole('admin'), ctrl.updatePickupStatus);



module.exports = router;
