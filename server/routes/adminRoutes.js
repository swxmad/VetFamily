const express = require('express');
const router = express.Router();
const {
  getAdminProfile,
  updateAdminProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getDoctorPatients,
  resetDoctorPassword,
  getAdminReports,
  searchPatients,
  completePatientTreatmentAdmin,
  restorePatientStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);
router.get('/doctors/:id/patients', getDoctorPatients);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.post('/doctors/:id/reset-password', resetDoctorPassword);

router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

router.put('/patients/:id/complete', completePatientTreatmentAdmin);
router.put('/patients/:id/restore', restorePatientStatus);

router.get('/search', searchPatients);

router.get('/reports', getAdminReports);

module.exports = router;