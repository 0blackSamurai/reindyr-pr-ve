const express = require('express');
const router = express.Router();
const dyrController = require('../controller/dyrController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/createReindyr', isAuthenticated, dyrController.renderCreateDyrPage);
router.post('/createdyr', dyrController.createDyr);
router.get('/search', dyrController.searchDyr);

module.exports = router;