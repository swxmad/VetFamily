import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import axiosInstance from '../../../api/axiosInstance';
import styles from './DoctorDashboard.module.css';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import ProfileTab from '../ProfileTab/ProfileTab';
import PatientsTab from '../PatientsTab/PatientsTab';
import DoctorScheduleTab from '../DoctorScheduleTab/DoctorScheduleTab';
import DoctorReportsTab from '../DoctorReportsTab/DoctorReportsTab';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const tabParam = searchParams.get('tab');
    if (tabParam === 'patients') {
      setActiveTab('patients');
    } else if (tabParam === 'schedule') {
      setActiveTab('schedule');
    } else if (tabParam === 'reports') {
      setActiveTab('reports');
    }
    
    fetchProfile();
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/doctor/profile');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Header />
        <main className={styles.main}>
          <div className={styles.loader}>Загрузка...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Header />

      <main className={styles.main}>
        <div className={styles.dashboard}>
          <aside className={styles.sidebar}>
            <div className={styles.userInfo}>
            </div>

            <nav className={styles.tabs}>
              <button
                className={`${styles.tabButton} ${activeTab === 'profile' ? styles.active : ''}`}
                onClick={() => setActiveTab('profile')}
              >Карточка</button>
              <button
                className={`${styles.tabButton} ${activeTab === 'patients' ? styles.active : ''}`}
                onClick={() => setActiveTab('patients')}
              >Журнал</button>
              <button
                className={`${styles.tabButton} ${activeTab === 'schedule' ? styles.active : ''}`}
                onClick={() => setActiveTab('schedule')}
              >Записи</button>
              <button
                className={`${styles.tabButton} ${activeTab === 'reports' ? styles.active : ''}`}
                onClick={() => setActiveTab('reports')}
              >Отчёты</button>
              <button className={styles.logoutButton} onClick={handleLogout}>Выйти</button>
            </nav>
          </aside>

          <section className={styles.content}>
            {activeTab === 'profile' && (
              <ProfileTab user={user} onUpdate={fetchProfile} />
            )}
            {activeTab === 'patients' && (
              <PatientsTab />
            )}
            {activeTab === 'schedule' && (
              <DoctorScheduleTab />
            )}
            {activeTab === 'reports' && (
              <DoctorReportsTab />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DoctorDashboard;