const express = require('express');
const router = express.Router();
const flokkController = require('../controller/flokkController');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/createflokk', flokkController.renderCreateFlokkPage);
router.post('/createflokk', upload.single('bilde'), flokkController.createFlokk);

module.exports = router;