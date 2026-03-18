import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axiosInstance from '../../../api/axiosInstance';
import styles from './PatientsTab.module.css';
import PatientCard from '../PatientCard/PatientCard';
import SearchBar from '../../../components/SearchBar/SearchBar';

const PatientsTab = () => {
  const navigate = useNavigate(); 
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axiosInstance.get('/admin/patients');
      if (response.data.success) {
        setPatients(response.data.patients);
      }
    } catch (error) {
      console.error('Ошибка получения пациентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (patient) => {
    navigate(`/admin/patients/${patient.id}`); 
  };

  return (
    <div className={styles.patientsTab}>
      <p className={styles.header}>Пациенты</p>
      
      <SearchBar
        role="admin"
        placeholder="Поиск"
        onSelect={(patient) => handleViewPatient(patient)}
      />

      {loading && <div className={styles.loading}>Загрузка пациентов...</div>}
      
      {!loading && patients.length === 0 ? (
        <div className={styles.emptyState}>
          <p>В системе пока нет пациентов</p>
        </div>
      ) : (
        <div className={styles.patientsGrid}>
          {patients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onView={handleViewPatient}
            />
          ))}
        </div>
      )}
      
    </div>
  );
};

export default PatientsTab;