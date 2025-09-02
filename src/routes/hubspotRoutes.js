const express = require('express');
const router = express.Router();
const hubspotController = require('../controllers/hubspotController');

router.post('/ticket-assign-employee/:ticketId', hubspotController.getTicketById);

module.exports = router;