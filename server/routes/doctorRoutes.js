const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  getMyPatients,
  getPatientsByStatus,
  completePatientTreatment,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientById,
  searchPatients,
  getDoctorReport 
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getMyProfile);
router.put('/profile', updateProfile);

router.get('/patients/status', getPatientsByStatus);
router.post('/patients', createPatient);
router.put('/patients/:id/complete', completePatientTreatment);

router.get('/patients', getMyPatients);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

router.get('/search', searchPatients);
router.get('/reports', getDoctorReport);

module.exports = router;