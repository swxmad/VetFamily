const express = require('express');
const router = express.Router();
const {
  createVisit,
  getPatientVisits,
  updateVisit,
  deleteVisit,
  getDoctorSchedule,
  createPlannedVisit
} = require('../controllers/visitController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createVisit);
router.get('/patient/:patientId', getPatientVisits);
router.put('/:visitId', updateVisit);
router.delete('/:visitId', deleteVisit);

router.get('/schedule', getDoctorSchedule);
router.post('/schedule', createPlannedVisit);

module.exports = router;