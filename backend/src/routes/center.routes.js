const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/center.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', ctrl.listCenters);
router.get('/nearest/distance', ctrl.getNearestCentersByDistance);
router.post('/', auth.requireRole('admin'), ctrl.createCenter);

module.exports = router;
