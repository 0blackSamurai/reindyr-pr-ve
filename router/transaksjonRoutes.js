// router/transaksjonRoutes.js
const express = require('express');
const router = express.Router();
const transaksjonController = require('../controller/transaksjonController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/mineTransaksjoner', isAuthenticated, transaksjonController.mineTransaksjoner);
router.get('/startTransaksjon/:dyrId', isAuthenticated, transaksjonController.renderStartTransaksjon);
router.post('/opprettTransaksjon', isAuthenticated, transaksjonController.opprettTransaksjon);
router.post('/bekreftNyEier/:transaksjonId', isAuthenticated, transaksjonController.bekreftNyEier);
router.post('/avslåNyEier/:transaksjonId', isAuthenticated, transaksjonController.avslåNyEier);
router.post('/bekreftOpprinneligEier/:transaksjonId', isAuthenticated, transaksjonController.bekreftOpprinneligEier);
router.post('/avslåOpprinneligEier/:transaksjonId', isAuthenticated, transaksjonController.avslåOpprinneligEier);
router.post('/avbrytTransaksjon/:transaksjonId', isAuthenticated, transaksjonController.avbrytTransaksjon);

module.exports = router;