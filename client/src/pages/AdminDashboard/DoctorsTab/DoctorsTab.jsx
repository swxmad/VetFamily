import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import styles from './DoctorsTab.module.css';
import DoctorCard from '../DoctorCard/DoctorCard';

const DoctorsTab = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axiosInstance.get('/admin/doctors');
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      console.error('Ошибка получения врачей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor) => {
    navigate(`/admin/doctors/${doctor.id}`, { state: { fromTab: 'doctors' } });
  };
  
  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedDoctor(null);
  };

  const handleDoctorUpdated = () => {
    fetchDoctors();
    handleCloseModal();
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого врача? Все связанные данные будут удалены!')) return;
    
    try {
      const response = await axiosInstance.delete(`/admin/doctors/${id}`);
      if (response.data.success) {
        setDoctors(doctors.filter(d => d.id !== id));
        alert('Врач удалён из системы');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении врача');
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      doctor.fullName.toLowerCase().includes(term) ||
      doctor.email.toLowerCase().includes(term) ||
      (doctor.phone && doctor.phone.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return <div className={styles.loading}>Загрузка врачей...</div>;
  }

  return (
    <div className={styles.doctorsTab}>
        <p className={styles.header}>Врачи</p>

      <div className={styles.searchRow}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск"
          className={styles.searchInput}
        />
      </div>
      
      {filteredDoctors.length === 0 ? (
        <div className={styles.emptyState}>
          <p>В системе пока нет врачей</p>
        </div>
      ) : (
        <div className={styles.doctorsGrid}>
          {filteredDoctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onView={handleViewDoctor}
              onDelete={handleDeleteDoctor}
            />
          ))}
        </div>
      )}
      
      {showEditModal && selectedDoctor && (
        <EditDoctorModal
          doctor={selectedDoctor}
          onClose={handleCloseModal}
          onDoctorUpdated={handleDoctorUpdated}
        />
      )}
    </div>
  );
};

export default DoctorsTab;