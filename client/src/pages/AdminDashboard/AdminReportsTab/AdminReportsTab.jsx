import React, { useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AdminReportsTab.module.css';
import SearchBar from '../../../components/SearchBar/SearchBar';
import { useNavigate } from 'react-router-dom';


const AdminReportsTab = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const response = await axiosInstance.get(`/admin/reports?${params.toString()}`);
      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error('Ошибка отчёта админа:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.reportsTab}>
      <p className={styles.header}>Отчёты</p>

      <SearchBar
        role="admin"
        placeholder="Поиск"
        onSelect={(patient) => navigate(`/admin/patients/${patient.id}`)}
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
        <>
          <div className={styles.summary}>
            <div className={styles.card}>
              <span className={styles.label}>Всего приёмов</span>
              <span className={styles.value}>{report.totalVisits}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Всего пациентов</span>
              <span className={styles.value}>{report.totalPatients}</span>
            </div>
          </div>

          <h3 className={styles.subHeader}>По врачам</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Врач</th>
                <th>Логин</th>
                <th>Приёмов</th>
                <th>Пациентов</th>
              </tr>
            </thead>
            <tbody>
              {report.byDoctor.map((row) => (
                <tr key={row.doctor.id}>
                  <td>{row.doctor.fullName}</td>
                  <td>{row.doctor.email}</td>
                  <td>{row.visitsCount}</td>
                  <td>{row.patientsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminReportsTab;

