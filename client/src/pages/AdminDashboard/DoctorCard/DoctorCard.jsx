import React from 'react';
import styles from './DoctorCard.module.css';

const DoctorCard = ({ doctor, onView }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    let numbers = phone.replace(/\D/g, '');
    if (numbers.startsWith('8')) numbers = '7' + numbers.slice(1);
    if (!numbers.startsWith('7')) numbers = '7' + numbers;
    numbers = numbers.slice(0, 11);
    
    if (numbers.length === 0) return '';
    if (numbers.length === 1) return `+${numbers}`;
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9)}`;
  };

  const handleCardClick = () => {
    onView(doctor);
  };

  return (
    <div className={styles.doctorCard} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        <h3 className={styles.doctorName}>{doctor.fullName}</h3>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Email:</span>
          <span className={styles.value}>{doctor.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Телефон:</span>
          <span className={styles.value}>{formatPhone(doctor.phone)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Дата рождения:</span>
          <span className={styles.value}>{formatDate(doctor.birthDate)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Статус:</span>
          <span className={`${styles.status} ${doctor.isActive ? styles.active : styles.inactive}`}>
            {doctor.isActive ? 'Активен' : 'Деактивирован'}
          </span>
        </div>
      </div>
      
    </div>
  );
};

export default DoctorCard;