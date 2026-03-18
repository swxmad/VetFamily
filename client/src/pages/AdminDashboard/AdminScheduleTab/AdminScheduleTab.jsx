import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AdminScheduleTab.module.css';
import SearchBar from '../../../components/SearchBar/SearchBar';
import { useNavigate } from 'react-router-dom';

const AdminScheduleTab = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');


  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await axiosInstance.get('/admin/doctors');
        if (response.data.success) {
          setDoctors(response.data.doctors);
        }
      } catch (error) {
        console.error('Ошибка загрузки врачей:', error);
      }
    };
    loadDoctors();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (selectedDoctorId) params.append('doctorId', selectedDoctorId);
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

const filteredVisits = visits.filter(v =>
  search.trim() === '' ||
  v.patient?.name?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className={styles.scheduleTab}>
      <p className={styles.header}>Записи</p>

     <SearchBar
  role="admin"
  placeholder="Поиск"
  onChange={(value) => setSearch(value)}
/>


      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Врач</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            <option value="">Все</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>С</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <label>По</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className={styles.reloadButton} onClick={loadSchedule} disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать'}
        </button>
      </div>

      {visits.length === 0 && !loading && (
        <div className={styles.empty}>Записей на выбранный период нет</div>
      )}

      <div className={styles.list}>
        {filteredVisits.map((visit) => (
          <div key={visit.id} className={styles.item}>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminScheduleTab;

