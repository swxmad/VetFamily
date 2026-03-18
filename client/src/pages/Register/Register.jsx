import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const isRussianFullName = (value) => {
    return /^[А-Яа-яЁё\s-]+$/.test(value);
  };

  const formatBirthDate = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
    
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
  };

  const validateBirthDate = (birthDate) => {
    if (!birthDate || birthDate.length !== 10) {
      return { valid: false, message: 'Введите дату в формате дд.мм.гггг' };
    }

    const [day, month, year] = birthDate.split('.').map(Number);
    const today = new Date();

    if (day < 1 || day > 31) {
      return { valid: false, message: 'День должен быть от 1 до 31' };
    }

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Месяц должен быть от 1 до 12' };
    }

    if (year < 1926) {
      return { valid: false, message: 'Год рождения не может быть раньше 1926' };
    }

    const birth = new Date(year, month - 1, day);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    if (actualAge < 18) {
      return { valid: false, message: 'Врач должен быть старше 18 лет' };
    }

    if (birth > today) {
      return { valid: false, message: 'Дата рождения не может быть в будущем' };
    }

    return { valid: true, age: actualAge };
  };

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

    if (name === 'birthDate') {
      formattedValue = formatBirthDate(value); 
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'fullName') {
      if (value.length > 100) {
        formattedValue = value.slice(0, 100);
      }
      if (formattedValue && !isRussianFullName(formattedValue)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Введите ФИО';
    } else if (!isRussianFullName(formData.fullName)) {
      newErrors.fullName = 'ФИО должно быть только русскими буквами';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Максимальная длина ФИО — 100 символов';
    }

    if (!formData.gender) {
      newErrors.gender = 'Выберите пол';
    }
    
    const birthDateValidation = validateBirthDate(formData.birthDate);
    if (!birthDateValidation.valid) {
      newErrors.birthDate = birthDateValidation.message;
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 11) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    if (!formData.email) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/register', {
        fullName: formData.fullName,
        gender: formData.gender,
        birthDate: formData.birthDate.split('.').reverse().join('-'),
        phone: formData.phone,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/doctor');
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Ошибка при регистрации'
      });
    }
  };

  return (
    <div className={styles.authContainer}>
      <Header />

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <p className={styles.welcomeTitle}>Добрый день!</p>
          <p className={styles.welcomeText}>Авторизуйтесь для доступа к данным клиники.</p>
        </div>

        <div className={styles.authForm}>
          <p className={styles.formTitle}>Создайте аккаунт</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>ФИО</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Иванов Иван Иванович"
                className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
              />
              {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="gender" className={styles.label}>Пол</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`${styles.input} ${styles.select} ${errors.gender ? styles.inputError : ''}`}
              >
                <option value="">Выбрать</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
              {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="birthDate" className={styles.label}>Дата рождения</label>
              <input
                type="text"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder="дд.мм.гггг"
                maxLength="10"
                className={`${styles.input} ${errors.birthDate ? styles.inputError : ''}`}
              />
              {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>Номер телефона</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (xxx) xxx-xx-xx"
                maxLength="18"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Электронная почта</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@gmail.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Подтвердите пароль</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              />
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </div>

            {errors.submit && (
              <div className={styles.submitError}>{errors.submit}</div>
            )}

            <div className={styles.but}>
            <button type="submit" className={styles.submitButton}>
              Создать аккаунт
            </button>
            </div>
          </form>

          <div className={styles.switchForm}>
            <button
              type="button"
              className={styles.switchButton}
              onClick={() => navigate('/login')}
            ><p>Уже есть аккаунт? <span style={{color:"#00547E", fontWeight:"600"}}>Войти</span></p>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;