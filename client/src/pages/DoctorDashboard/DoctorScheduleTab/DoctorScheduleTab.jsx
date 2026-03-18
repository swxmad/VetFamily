import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import styles from './DoctorScheduleTab.module.css';
import SearchBar from '../../../components/SearchBar/SearchBar';
import { useNavigate } from 'react-router-dom';

const DoctorScheduleTab = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const response = await axiosInstance.get(`/visits/schedule?${params.toString()}`);
      if (response.data.success) {
        setVisits(response.data.visits || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const filteredVisits = visits.filter(v =>
  search.trim() === '' ||
  v.patient?.name?.toLowerCase().includes(search.toLowerCase())
);


  return (
    <div className={styles.scheduleTab}>
      <p className={styles.header}>Записи</p>

      <SearchBar
  role="doctor"
  placeholder="Поиск"
  onChange={(value) => setSearch(value)}
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
        <button className={styles.reloadButton} onClick={loadSchedule} disabled={loading}>
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {visits.length === 0 && !loading && (
        <div className={styles.empty}>Записей на выбранный период нет</div>
      )}

      <div className={styles.list}>
        {filteredVisits.map((visit) => (
          <div
            key={visit.id}
            className={styles.item}
            onClick={() => visit.patient && navigate(`/doctor/patient/${visit.patient.id}`)}
          >
            <div className={styles.row}>
              <span className={styles.date}>
                {new Date(visit.date).toLocaleDateString('ru-RU')}
                {visit.time && `, ${visit.time}`}
              </span>
            </div>
            {visit.patient && (
              <div className={styles.row}>
                <span className={styles.pet}>{visit.patient.name}</span>
                <span className={styles.owner}>{visit.patient.ownerName}</span>
              </div>
            )}
            {visit.complaints && (
              <div className={styles.complaints}>{visit.complaints}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorScheduleTab;

