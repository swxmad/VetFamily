const express = require('express');
const router = express.Router();
const { getPatientById } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id', getPatientById);

module.exports = router;
