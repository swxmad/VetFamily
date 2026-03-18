import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axiosInstance from '../../../api/axiosInstance';
import styles from './PatientsTab.module.css';
import PatientCard from '../PatientCard/PatientCard';
import SearchBar from '../../../components/SearchBar/SearchBar';

const PatientsTab = () => {
  const navigate = useNavigate(); 
  const [activeStatusTab, setActiveStatusTab] = useState('active');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPatients();
  }, [activeStatusTab]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      console.log('Запрос пациентов, статус:', activeStatusTab);
      const response = await axiosInstance.get(`/doctor/patients/status?status=${activeStatusTab}`);
      console.log('Ответ сервера:', response.data);
      if (response.data.success) {
        setPatients(response.data.patients);
        console.log('Пациентов найдено:', response.data.patients.length);
      }
    } catch (error) {
      console.error('Ошибка получения пациентов:', error);
      console.error('Ответ:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = () => {
    navigate('/doctor/patient/new'); 
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пациента?')) return;
    try {
      const response = await axiosInstance.delete(`/doctor/patients/${id}`);
      if (response.data.success) {
        setPatients(patients.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении пациента');
    }
  };

  const handleCompleteTreatment = async (id) => {
    if (!window.confirm('Завершить лечение этого пациента?')) return;
    try {
      const response = await axiosInstance.put(`/doctor/patients/${id}/complete`);
      if (response.data.success) {
        alert('Лечение завершено!');
        fetchPatients();
      }
    } catch (error) {
      console.error('Ошибка завершения:', error);
      alert(error.response?.data?.message || 'Ошибка при завершении лечения');
    }
  };

  return (
    <div className={styles.patientsTab}>
        <p className={styles.header}>Журнал</p>

      <SearchBar
        role="doctor"
        placeholder="Поиск"
        onSelect={(patient) => navigate(`/doctor/patient/${patient.id}`)}
      />

      {loading && <div className={styles.loading}>Загрузка пациентов...</div>}

      <div className={styles.statusTabs}>
        <button
          className={`${styles.statusTab} ${activeStatusTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveStatusTab('active')}
        >
          Активные
        </button>
        <button
          className={`${styles.statusTab} ${activeStatusTab === 'completed' ? styles.active : ''}`}
          onClick={() => setActiveStatusTab('completed')}
        >
          Завершённые
        </button>
        {activeStatusTab === 'active' && (
          <button className={styles.addButton} onClick={handleAddPatient}>
          +
          </button>
        )}
      </div>

      {!loading && patients.length === 0 ? (
        <div className={styles.emptyState}>
          {activeStatusTab === 'active' ? (
            <>
              <p>У вас пока нет активных пациентов</p>
            </>
          ) : (
            <p>Нет завершённых пациентов</p>
          )}
        </div>
      ) : (
        <div className={styles.patientsGrid}>
          {patients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onUpdate={fetchPatients}
              isCompleted={activeStatusTab === 'completed'}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default PatientsTab;