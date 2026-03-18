import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import axiosInstance from '../../../api/axiosInstance';
import styles from './DoctorDetail.module.css';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import PatientCard from '../PatientCard/PatientCard';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activePatientsTab, setActivePatientsTab] = useState('active');

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDoctorData();
  }, [id]);

  const fetchDoctorData = async () => {
    try {
      const [doctorRes, patientsRes] = await Promise.all([
        axiosInstance.get(`/admin/doctors/${id}`),
        axiosInstance.get(`/admin/patients`)
      ]);

      if (doctorRes.data.success) {
        const d = doctorRes.data.doctor;
        setDoctor(d);
        setFormData({
          fullName: d.fullName || '',
          gender: d.gender || '',
          birthDate: formatDateForInput(d.birthDate),
          phone: d.phone || '',
          email: d.email || '',
          isActive: d.isActive || true,
        });
      }

      if (patientsRes.data.success) {
        const doctorPatients = patientsRes.data.patients.filter(
          p => p.doctor?.id === parseInt(id)
        );
        setPatients(doctorPatients);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      if (error.response?.status === 404) {
        navigate('/admin?tab=doctors');
      }
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  const handleBack = () => {
    if (location.state?.fromTab === 'doctors') {
      navigate('/admin', { state: { activeTab: 'doctors' } });
    } else {
      navigate(-1);
    }
  };

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
    const { name, value, type, checked } = e.target;
    let formattedValue = type === 'checkbox' ? checked : value;

    if (name === 'birthDate') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 2) formattedValue = numbers;
      else if (numbers.length <= 4) formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      else if (numbers.length <= 8) formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
      else formattedValue = `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'avatarUrl') {
      formattedValue = value;
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

    try {
      const response = await axiosInstance.put(`/admin/doctors/${id}`, {
        fullName: formData.fullName,
        gender: formData.gender,
        birthDate: formatDateForServer(formData.birthDate),
        phone: formData.phone,
        email: formData.email,
        isActive: formData.isActive
      });

      if (response.data.success) {
        alert('Данные врача обновлены!');
        setIsEditing(false);
        setErrors({});
        fetchDoctorData();
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Ошибка при обновлении'
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: doctor?.fullName || '',
      gender: doctor?.gender || '',
      birthDate: formatDateForInput(doctor?.birthDate),
      phone: doctor?.phone || '',
      email: doctor?.email || '',
      isActive: doctor?.isActive || true,
      avatarUrl: doctor?.avatarUrl || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  const handleDeleteAvatar = async () => {
    try {
      await axiosInstance.delete(`/admin/doctors/${id}/avatar`);
      setFormData(prev => ({ ...prev, avatarUrl: '' }));
      setDoctor(prev => ({ ...prev, avatarUrl: '' }));
      alert('Аватар удалён');
    } catch (error) {
      alert('Ошибка при удалении аватара');
    }
  };

  const handleDeleteDoctor = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этого врача? Все связанные данные будут удалены!')) return;

    try {
      const response = await axiosInstance.delete(`/admin/doctors/${id}`);
      if (response.data.success) {
        alert('Врач удалён из системы');
        navigate('/admin?tab=doctors');
      }
    } catch (error) {
      alert('Ошибка при удалении врача');
    }
  };

  const handleResetPassword = async () => {
    const newPassword = window.prompt('Введите новый пароль для врача (минимум 6 символов):');
    if (newPassword === null) return;
    if (!newPassword || newPassword.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }

    const adminPassword = window.prompt('Для подтверждения введите пароль администратора:');
    if (adminPassword === null) return;
    if (!adminPassword) {
      alert('Пароль администратора не может быть пустым');
      return;
    }

    try {
      const response = await axiosInstance.post(`/admin/doctors/${id}/reset-password`, {
        newPassword,
        adminPassword
      });

      if (response.data.success) {
        alert('Пароль врача успешно сброшен. Сообщите новый пароль врачу.');
      } else {
        alert(response.data.message || 'Не удалось сбросить пароль');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при сбросе пароля');
    }
  };

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <Header />
        <main className={styles.main}>
          <div className={styles.loader}>Загрузка данных врача...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className={styles.detailContainer}>
        <Header />
        <main className={styles.main}>
          <div className={styles.error}>Врач не найден</div>
        </main>
        <Footer />
      </div>
    );
  }

  const activePatients = patients.filter(p => p.status === 'active');
  const completedPatients = patients.filter(p => p.status === 'completed');

  return (
    <div className={styles.detailContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.doctorDetail}>
          <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
  Назад 
</button>
            <h1>{doctor.fullName}</h1>
            <div className={styles.headerActions}>
              {!isEditing ? (
                <>
                  <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                    Редактировать
                  </button>
                  <button className={styles.resetPasswordButton} onClick={handleResetPassword}>
                    Сбросить пароль
                  </button>
                  <button className={styles.deleteButton} onClick={handleDeleteDoctor}>
                    Удалить
                  </button>
                </>
              ) : (
                <>
                  <button className={styles.saveButton} onClick={handleSubmit}>
                    Сохранить
                  </button>
                  <button className={styles.cancelButton} onClick={handleCancel}>
                    Отмена
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email:</span>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.infoInput} ${errors.email ? styles.inputError : ''}`}
                  />
                ) : (
                  <span className={styles.infoValue}>{doctor.email}</span>
                )}
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Телефон:</span>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${styles.infoInput} ${errors.phone ? styles.inputError : ''}`}
                  />
                ) : (
                  <span className={styles.infoValue}>{formatPhone(doctor.phone)}</span>
                )}
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Дата рождения:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="birthDate"
                    value={formatDateForInput(formData.birthDate)}
                    onChange={handleChange}
                    placeholder="дд.мм.гггг"
                    maxLength="10"
                    className={`${styles.infoInput} ${errors.birthDate ? styles.inputError : ''}`}
                  />
                ) : (
                  <span className={styles.infoValue}>{formatDateForInput(doctor.birthDate)}</span>
                )}
                {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Пол:</span>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`${styles.infoInput} ${styles.select} ${errors.gender ? styles.inputError : ''}`}
                  >
                    <option value="">Выберите пол</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                ) : (
                  <span className={styles.infoValue}>{doctor.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                )}
                {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Статус:</span>
                {isEditing ? (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span>Активен в системе</span>
                  </label>
                ) : (
                  <span className={`${styles.statusBadge} ${doctor.isActive ? styles.active : styles.inactive}`}>
                    {doctor.isActive ? 'Активен' : 'Деактивирован'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

          <div className={styles.patientsSection}>
            <div className={styles.patientsHeader}>
              <h2>Пациенты врача</h2>
              <div className={styles.patientsTabs}>
                <button
                  className={`${styles.patientsTab} ${activePatientsTab === 'all' ? styles.active : ''}`}
                  onClick={() => setActivePatientsTab('all')}
                >
                  Все ({patients.length})
                </button>
                <button
                  className={`${styles.patientsTab} ${activePatientsTab === 'active' ? styles.active : ''}`}
                  onClick={() => setActivePatientsTab('active')}
                >
                  Активные ({activePatients.length})
                </button>
                <button
                  className={`${styles.patientsTab} ${activePatientsTab === 'completed' ? styles.active : ''}`}
                  onClick={() => setActivePatientsTab('completed')}
                >
                  Завершённые ({completedPatients.length})
                </button>
              </div>
            </div>

            {patients.length === 0 ? (
              <div className={styles.emptyPatients}>
                <p>У этого врача пока нет пациентов</p>
              </div>
            ) : (
              <div className={styles.patientsGrid}>
                {(activePatientsTab === 'all' ? patients :
                  activePatientsTab === 'active' ? activePatients : completedPatients
                ).map(patient => (
                  <PatientCard key={patient.id} patient={patient} onView={() => { }} onDelete={() => { }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDetail;