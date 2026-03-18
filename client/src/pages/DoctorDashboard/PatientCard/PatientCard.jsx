import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientCard.module.css';

const PatientCard = ({ patient, isCompleted }) => {
  const navigate = useNavigate();

  const truncate = (value, max = 27) => {
    if (!value) return '';
    const str = String(value);
    if (str.length <= max) return str;
    return str.slice(0, max) + '...';
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
    navigate(`/doctor/patient/${patient.id}`);
  };

  return (
    <div 
      className={`${styles.patientCard} ${isCompleted ? styles.completed : ''} ${styles.clickable}`}
      onClick={handleCardClick}
    >
        <h3 className={styles.patientName}>{truncate(patient.name)}</h3>
      
      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Вид:</span>
          <span className={styles.value}>{truncate(patient.species)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Порода:</span>
          <span className={styles.value}>{truncate(patient.breed || 'Не указана')}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Возраст:</span>
          <span className={styles.value}>{truncate(patient.age)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Владелец:</span>
          <span className={styles.value}>{truncate(patient.ownerName)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Телефон:</span>
          <span className={styles.value}>{formatPhone(patient.ownerPhone)}</span>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;