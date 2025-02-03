const express = require('express');
const { createEvent, recordTransaction, getStats } = require('../controllers/eventControllers');
const router = express.Router();

router.post('/events', createEvent);
router.post('/tickets', recordTransaction);
router.get('/stats', getStats);

module.exports = router;
