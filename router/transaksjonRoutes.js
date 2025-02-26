// router/transaksjonRoutes.js
const express = require('express');
const router = express.Router();
const transaksjonController = require('../controller/transaksjonController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/mineTranaksjoner', isAuthenticated, transaksjonController.mineTransaksjoner);
router.get('/startTransaksjon/:dyrId', isAuthenticated, transaksjonController.renderStartTransaksjon);
router.post('/opprettTransaksjon', isAuthenticated, transaksjonController.opprettTransaksjon);
router.post('/bekreftTransaksjon/:transaksjonId', isAuthenticated, transaksjonController.bekreftTransaksjon);
router.post('/avslåTransaksjon/:transaksjonId', isAuthenticated, transaksjonController.avslåTransaksjon);
router.post('/avbrytTransaksjon/:transaksjonId', isAuthenticated, transaksjonController.avbrytTransaksjon);

module.exports = router;