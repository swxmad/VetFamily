import React, { useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AddPatientModal.module.css';

const AddPatientModal = ({ onClose, onPatientAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    ownerName: '',
    ownerPhone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isRussianText = (value) => /^[А-Яа-яЁё\s-]+$/.test(value);

  const formatPhone = (value) => {
    let numbers = value.replace(/\D/g, '');
    
    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.slice(1);
    }
    
    if (!numbers.startsWith('7')) {
      numbers = '7' + numbers;
    }
    
    numbers = numbers.slice(0, 11);
    
    if (numbers.length === 0) return '';
    if (numbers.length === 1) return `+${numbers}`;
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    if (numbers.length <= 11) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9)}`;
    
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'ownerPhone') {
      formattedValue = formatPhone(value);
    } else if (name === 'name') {
      formattedValue = value.slice(0, 20);
      if (formattedValue && !isRussianText(formattedValue)) return;
    } else if (name === 'species' || name === 'breed') {
      formattedValue = value.slice(0, 30);
      if (formattedValue && !isRussianText(formattedValue)) return;
    } else if (name === 'ownerName') {
      formattedValue = value.slice(0, 50);
      if (formattedValue && !isRussianText(formattedValue)) return;
    } else if (name === 'age') {
      formattedValue = value.slice(0, 15);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Отправка формы:', formData); 
  
  const newErrors = {};
  
  if (!formData.name.trim()) newErrors.name = 'Введите кличку';
  if (formData.name && !isRussianText(formData.name)) newErrors.name = 'Кличка должна быть только русскими буквами';

  if (!formData.species.trim()) newErrors.species = 'Введите вид';
  if (formData.species && !isRussianText(formData.species)) newErrors.species = 'Вид должен быть только русскими буквами';

  if (formData.breed && !isRussianText(formData.breed)) newErrors.breed = 'Порода должна быть только русскими буквами';

  if (!formData.age) newErrors.age = 'Введите возраст';
  if (formData.age && formData.age.length > 15) newErrors.age = 'Возраст не более 15 символов';

  if (!formData.ownerName.trim()) newErrors.ownerName = 'Введите имя владельца';
  if (formData.ownerName && !isRussianText(formData.ownerName)) newErrors.ownerName = 'ФИО владельца должно быть только русскими буквами';
  if (formData.ownerName && formData.ownerName.length > 50) newErrors.ownerName = 'ФИО владельца не более 50 символов';
  if (!formData.ownerPhone || formData.ownerPhone.replace(/\D/g, '').length < 11) {
    newErrors.ownerPhone = 'Введите корректный номер телефона';
  }
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  setLoading(true);
  try {
    const response = await axiosInstance.post('/doctor/patients', formData);
    console.log('Ответ от сервера:', response.data); 
    
    if (response.data.success) {
      onPatientAdded();
      alert('Пациент успешно добавлен!');
    }
  } catch (error) {
    console.error('Ошибка добавления пациента:', error);
    console.error('Ответ сервера:', error.response?.data);
    setErrors({
      submit: error.response?.data?.message || 'Ошибка при добавлении'
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p style={{fontFamily:"Mulish"}}>Добавить пациента</p>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Кличка *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength="20"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Вид *</label>
              <input
                type="text"
                name="species"
                value={formData.species}
                onChange={handleChange}
                placeholder="Собака, кошка..."
                maxLength="30"
                className={`${styles.input} ${errors.species ? styles.inputError : ''}`}
              />
              {errors.species && <span className={styles.errorText}>{errors.species}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Порода</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                maxLength="30"
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Возраст (лет) *</label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              maxLength="15"
              className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
            />
            {errors.age && <span className={styles.errorText}>{errors.age}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Имя владельца *</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              maxLength="50"
              className={`${styles.input} ${errors.ownerName ? styles.inputError : ''}`}
            />
            {errors.ownerName && <span className={styles.errorText}>{errors.ownerName}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Телефон владельца *</label>
            <input
              type="tel"
              name="ownerPhone"
              value={formData.ownerPhone}
              onChange={handleChange}
              placeholder="+7 (xxx) xxx-xx-xx"
              maxLength="18"
              className={`${styles.input} ${errors.ownerPhone ? styles.inputError : ''}`}
            />
            {errors.ownerPhone && <span className={styles.errorText}>{errors.ownerPhone}</span>}
          </div>
          
          {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;