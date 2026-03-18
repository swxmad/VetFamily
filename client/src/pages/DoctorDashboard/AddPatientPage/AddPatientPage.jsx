import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AddPatientPage.module.css';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

const AddPatientPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    ownerName: '',
    ownerPhone: '',
    complaints: '',
    diagnosis: '',
    medications: '',
    nextVisitDate: '',
    careInstructions: ''
  });
  const [errors, setErrors] = useState({});

  const isRussianText = (value) => /^[А-Яа-яЁё\s-]+$/.test(value);

  const formatPhone = (value) => {
    let numbers = value.replace(/\D/g, '');
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
    } else if (name === 'complaints' || name === 'diagnosis' || name === 'medications' || name === 'careInstructions') {
      formattedValue = value.slice(0, 100);
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (response.data.success) {
        alert('Пациент успешно добавлен!');
        navigate(`/doctor/patient/${response.data.patient.id}`);
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Ошибка при добавлении' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Карта пациента - ${formData.name || 'Новый пациент'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #007BB8; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>${formData.name || 'Пациент'}</h1>
          <div class="section">
            <h2>Дата текущего приёма:</h2>
            <p>${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          <div class="section">
            <h2>Дата следующего приёма:</h2>
            <p>${formData.nextVisitDate ? new Date(formData.nextVisitDate).toLocaleDateString('ru-RU') : 'Не назначена'}</p>
          </div>
          <div class="section">
            <h2>Показания к уходу:</h2>
            <p>${formData.careInstructions || 'Нет показаний'}</p>
          </div>
          <div class="section">
            <h2>Лекарства:</h2>
            <p>${formData.medications || 'Не назначены'}</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.addPatientPage}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/doctor')}>Назад</button>
            <h1>Новый пациент</h1>
            <button className={styles.printButton} onClick={handlePrint} disabled={loading}>
              Печать
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.info}>
            <section className={styles.section}>
              <h2>Данные животного</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} maxLength="20" className={`${styles.input} ${errors.name ? styles.inputError : ''}`} placeholder="Кличка *" />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    maxLength="15"
                    className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
                    placeholder="Возраст *"
                  />
                  {errors.age && <span className={styles.errorText}>{errors.age}</span>}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input type="text" name="species" value={formData.species} onChange={handleChange} maxLength="30" className={`${styles.input} ${errors.species ? styles.inputError : ''}`} placeholder="Вид *" />
                  {errors.species && <span className={styles.errorText}>{errors.species}</span>}
                </div>
                <div className={styles.formGroup}>
                  <input type="text" name="breed" value={formData.breed} onChange={handleChange} maxLength="30" className={styles.input} placeholder="Порода" />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Данные владельца</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} maxLength="50" className={`${styles.input} ${errors.ownerName ? styles.inputError : ''}`} placeholder="ФИО владельца* " />
                  {errors.ownerName && <span className={styles.errorText}>{errors.ownerName}</span>}
                </div>
                <div className={styles.formGroup}>
                  <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} className={`${styles.input} ${errors.ownerPhone ? styles.inputError : ''}`} placeholder="+7 (xxx) xxx-xx-xx *" maxLength="18" />
                  {errors.ownerPhone && <span className={styles.errorText}>{errors.ownerPhone}</span>}
                </div>
              </div>
            </section>
            </div>

            <section className={styles.reception}>
              <h2>Данные приёма</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Дата следующего приёма</label>
                  <input type="date" name="nextVisitDate" value={formData.nextVisitDate} onChange={handleChange} className={styles.input} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Жалобы / Состояние</label>
                <textarea name="complaints" value={formData.complaints} onChange={handleChange} rows="3" className={styles.textarea} placeholder="Опишите состояние пациента..." />
              </div>
              <div className={styles.formGroup}>
                <label>Диагноз</label>
                <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows="2" className={styles.textarea} placeholder="Предварительный диагноз..." />
              </div>
              <div className={styles.formGroup}>
                <label>Лекарства</label>
                <textarea name="medications" value={formData.medications} onChange={handleChange} rows="2" className={styles.textarea} placeholder="Назначенные препараты, дозировка..." />
              </div>
              <div className={styles.formGroup}>
                <label>Показания к уходу</label>
                <textarea name="careInstructions" value={formData.careInstructions} onChange={handleChange} rows="2" className={styles.textarea} placeholder="Рекомендации по уходу, питанию..." />
              </div>
            </section>

            {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить пациента'}
              </button>
              <button type="button" className={styles.cancelButton} onClick={() => navigate('/doctor')}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddPatientPage;