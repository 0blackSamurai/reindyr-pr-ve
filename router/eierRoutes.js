const express = require('express');
const router = express.Router();
const eierController = require('../controller/eierController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/mineFlokker', isAuthenticated, eierController.mineFlokker);
router.get('/internOverføring/:dyrId', isAuthenticated, eierController.renderInternOverføring);
router.post('/internOverføring', isAuthenticated, eierController.internOverføring);

module.exports = router;