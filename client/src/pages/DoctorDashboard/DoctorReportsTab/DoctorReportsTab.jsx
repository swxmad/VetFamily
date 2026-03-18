import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import styles from './DoctorReportsTab.module.css';
import SearchBar from '../../../components/SearchBar/SearchBar';

const DoctorReportsTab = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const response = await axiosInstance.get(`/doctor/reports?${params.toString()}`);
      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error('Ошибка получения отчёта:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.reportsTab}>
      <p className={styles.header}>Отчёты</p>

      <SearchBar
        role="doctor"
        placeholder="Поиск"
        onSelect={(patient) => navigate(`/doctor/patient/${patient.id}`)}
      />

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>С</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <label>По</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className={styles.loadButton} onClick={loadReport} disabled={loading}>
          {loading ? 'Формирование...' : 'Сформировать'}
        </button>
      </div>

      {report && (
        <div className={styles.summary}>
          <div className={styles.card}>
            <span className={styles.label}>Приёмов за период</span>
            <span className={styles.value}>{report.visitsCount}</span>
          </div>
          <div className={styles.card}>
            <span className={styles.label}>Новых пациентов</span>
            <span className={styles.value}>{report.patientsCount}</span>
          </div>
          <div className={styles.card}>
            <span className={styles.label}>Завершённых лечений</span>
            <span className={styles.value}>{report.completedPatientsCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReportsTab;

