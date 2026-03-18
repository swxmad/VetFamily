import React, { useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AdminProfileTab.module.css';

const AdminProfileTab = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    gender: user?.gender || '',
    birthDate: user?.birthDate || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateForServer = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('.');
    return `${year}-${month}-${day}`;
  };

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

    if (name === 'birthDate') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 2) formattedValue = numbers;
      else if (numbers.length <= 4) formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      else if (numbers.length <= 8) formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
      else formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name] || errors.submit) {
      setErrors(prev => ({ 
        ...prev, 
        [name]: '', 
        submit: '' 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Введите ФИО';
    if (!formData.gender) newErrors.gender = 'Выберите пол';
    if (!formData.birthDate) newErrors.birthDate = 'Введите дату рождения';
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 11) {
      newErrors.phone = 'Введите корректный номер';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put('/admin/profile', {
        fullName: formData.fullName,
        gender: formData.gender,
        birthDate: formatDateForServer(formData.birthDate),
        phone: formData.phone,
        email: formData.email
      });

      if (response.data.success) {
        onUpdate();
        setIsEditing(false);
        setErrors({});
        alert('Данные успешно обновлены!');
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Ошибка при обновлении'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      gender: user?.gender || '',
      birthDate: formatDateForInput(user?.birthDate),
      phone: user?.phone || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassLoading(true);
    try {
      const payload = {
        newPassword: passForm.newPassword,
        ...(passForm.oldPassword ? { oldPassword: passForm.oldPassword } : { confirmNewPassword: passForm.confirmNewPassword })
      };
      const res = await axiosInstance.post('/auth/change-password', payload);
      if (res.data.success) {
        alert('Пароль изменён');
        setShowPasswordModal(false);
        setPassForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (error) {
      setPassError(error.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className={styles.profileTab}>
      <p className={styles.header}>Администратор</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Логин</label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className={`${styles.input} ${styles.disabled}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>ФИО</label>
            {isEditing ? (
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
              />
            ) : (
              <input type="text" value={user?.fullName || ''} disabled className={`${styles.input} ${styles.disabled}`} />
            )}
            {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Пол</label>
            {isEditing ? (
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`${styles.input} ${styles.select} ${errors.gender ? styles.inputError : ''}`}
              >
                <option value="">Выберите пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            ) : (
              <input
                type="text"
                value={user?.gender === 'male' ? 'Мужской' : 'Женский'}
                disabled
                className={`${styles.input} ${styles.disabled}`}
              />
            )}
            {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Дата рождения</label>
            {isEditing ? (
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder="дд.мм.гггг"
                maxLength="10"
                className={`${styles.input} ${errors.birthDate ? styles.inputError : ''}`}
              />
            ) : (
              <input type="text" value={formatDateForInput(user?.birthDate)} disabled className={`${styles.input} ${styles.disabled}`} />
            )}
            {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Номер телефона</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (xxx) xxx-xx-xx"
                maxLength="18"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              />
            ) : (
              <input type="tel" value={user?.phone || ''} disabled className={`${styles.input} ${styles.disabled}`} />
            )}
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Электронная почта</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
            ) : (
              <input type="email" value={user?.email || ''} disabled className={`${styles.input} ${styles.disabled}`} />
            )}
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          {!isEditing && (
            <button type="button" className={styles.editButton} onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          )}

          {!isEditing && (
            <button
              type="button"
              className={styles.passwordButton}
              onClick={() => setShowPasswordModal(true)}
            >
              Сменить пароль
            </button>
          )}

          {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

          {
            isEditing && (
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                  Отмена
                </button>
              </div>
            )
          }
        </div>
      </form >

      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>Смена пароля</p>
              <button type="button" className={styles.modalClose} onClick={() => setShowPasswordModal(false)}>×</button>
            </div>

            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              <label className={styles.modalLabel}>Старый пароль (или оставьте пустым)</label>
              <input
                type="password"
                value={passForm.oldPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, oldPassword: e.target.value }))}
                className={styles.modalInput}
              />

              <label className={styles.modalLabel}>Новый пароль</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                className={styles.modalInput}
                required
              />

              <label className={styles.modalLabel}>Повтор нового пароля (если не вводили старый)</label>
              <input
                type="password"
                value={passForm.confirmNewPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                className={styles.modalInput}
              />

              {passError && <div className={styles.modalError}>{passError}</div>}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.modalSave} disabled={passLoading}>
                  {passLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" className={styles.modalCancel} onClick={() => setShowPasswordModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileTab;