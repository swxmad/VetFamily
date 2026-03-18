import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './theme.css';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import PatientDetail from './pages/DoctorDashboard/PatientDetail/PatientDetail';
import AddPatientPage from './pages/DoctorDashboard/AddPatientPage/AddPatientPage';
import DoctorDetail from './pages/AdminDashboard/DoctorDetail/DoctorDetail'; 
import AdminPatientDetail from './pages/AdminDashboard/AdminPatientDetail/AdminPatientDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patient/:id" element={<PatientDetail />} />
        <Route path="/doctor/patient/new" element={<AddPatientPage />} /> 
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/doctors/:id" element={<DoctorDetail />} /> 
        <Route path="/admin/patients/:id" element={<AdminPatientDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;