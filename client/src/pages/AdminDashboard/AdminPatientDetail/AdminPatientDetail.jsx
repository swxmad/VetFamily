import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import styles from './AdminPatientDetail.module.css';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';

const AdminPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [expandedVisits, setExpandedVisits] = useState({});
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    complaints: '',
    diagnosis: '',
    medications: '',
    nextVisitDate: '',
    careInstructions: ''
  });

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const patientRes = await axiosInstance.get(`/admin/patients/${id}`);

      if (patientRes.data.success) {
        setPatient(patientRes.data.patient);
        setVisits(patientRes.data.patient.visits || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки пациента:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisit = async () => {
    if (visitForm.nextVisitDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(visitForm.nextVisitDate);
      nextDate.setHours(0, 0, 0, 0);
      if (nextDate < today) {
        alert('Дата следующего приёма не может быть раньше сегодняшней');
        return;
      }
    }
    try {
      const response = await axiosInstance.post('/visits', {
        patientId: id,
        ...visitForm
      });
      if (response.data.success) {
        alert('Визит добавлен!');
        setShowAddVisit(false);
        fetchPatientData();
        setVisitForm({
          date: new Date().toISOString().split('T')[0],
          complaints: '',
          diagnosis: '',
          medications: '',
          nextVisitDate: '',
          careInstructions: ''
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при добавлении визита');
    }
  };

  const handleCompleteTreatment = async () => {
    if (!window.confirm('Завершить лечение пациента?')) return;
    try {
      const response = await axiosInstance.put(`/admin/patients/${id}/complete`);
      if (response.data.success) {
        alert('Лечение завершено!');
        fetchPatientData();
      }
    } catch (error) {
      alert('Ошибка при завершении лечения');
    }
  };

  const handleRestoreTreatment = async () => {
    if (!window.confirm('Вернуть карту пациента в активные?')) return;
    try {
      const response = await axiosInstance.put(`/admin/patients/${id}/restore`);
      if (response.data.success) {
        alert('Карта пациента возвращена в активные!');
        fetchPatientData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при возврате карты пациента');
    }
  };

  const toggleExpand = (visitId) => {
    setExpandedVisits(prev => ({
      ...prev,
      [visitId]: !prev[visitId]
    }));
  };

  const formatNextVisitDate = (value) => {
    if (!value || value === 'null') return 'Не назначена';

    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Не назначена';

    return d.toLocaleDateString('ru-RU');
  };

  const getLatestDiagnosis = () => {
    for (const v of visits) {
      const desc = v?.diagnosis?.description;
      if (desc && desc.trim()) return desc;
    }
    return 'Не установлен';
  };


  const handleDeletePatient = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пациента? Все данные будут удалены безвозвратно!')) return;

    try {
      const response = await axiosInstance.delete(`/admin/patients/${id}`);
      if (response.data.success) {
        alert('Пациент удалён из системы');
        navigate('/admin?tab=patients');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert(error.response?.data?.message || 'Ошибка при удалении пациента');
    }
  };

  const handlePrint = () => {
    const latestDiagnosis = getLatestDiagnosis();
    const printContent = `
      <html>
        <head>
          <title>Карта пациента - ${patient?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #007BB8; }
            .info { margin: 10px 0; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>${patient?.name}</h1>
          <div class="info"><strong>Вид:</strong> ${patient?.species}</div>
          <div class="info"><strong>Порода:</strong> ${patient?.breed || 'Не указана'}</div>
          <div class="info"><strong>Возраст:</strong> ${patient?.age} </div>
          <div class="info"><strong>Владелец:</strong> ${patient?.ownerName}</div>
          <div class="info"><strong>Телефон:</strong> ${patient?.ownerPhone}</div>
          
          <div class="section">
            <h2>Дата текущего приёма:</h2>
            <p>${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          
          <div class="section">
            <h2>Дата следующего приёма:</h2>
            <p>${patient?.nextVisitDate ? new Date(patient.nextVisitDate).toLocaleDateString('ru-RU') : 'Не назначена'}</p>
          </div>
          
          <div class="section">
            <h2>Диагноз:</h2>
            <p>${latestDiagnosis}</p>
          </div>
          
          <div class="section">
            <h2>Лекарства:</h2>
            <p>${visits[0]?.treatments?.[0]?.medicationName || 'Не назначены'}</p>
          </div>
          
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!patient) return <div className={styles.error}>Пациент не найден</div>;

  return (
    <div className={styles.detailContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.patientDetail}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/admin?tab=patients')}>Назад</button>
            <h1>{patient.name}</h1>
            <div className={styles.actions}>
              <button className={styles.printButton} onClick={handlePrint}>Печать</button>
              {patient.status === 'active' && (
                <button className={styles.completeButton} onClick={handleCompleteTreatment}>Завершить лечение</button>
              )}
              {patient.status === 'completed' && (
                <button className={styles.restoreButton} onClick={handleRestoreTreatment}>Вернуть в активные</button>
              )}
              <button className={styles.deleteButton} onClick={handleDeletePatient}>Удалить</button>
            </div>
          </div>

          <div className={styles.information}>
            <div className={styles.infoCard}>
              <h2>Информация о пациенте</h2>
              <div className={styles.infoGrid}>
                <div className={styles.inform}>
                  <div className={styles.infoItem}><span className={styles.label}>Вид:</span><span className={styles.value}>{patient.species}</span></div>
                  <div className={styles.infoItem}><span className={styles.label}>Порода:</span><span className={styles.value}>{patient.breed || 'Не указана'}</span></div>
                  <div className={styles.infoItem}><span className={styles.label}>Возраст:</span><span className={styles.value}>{patient.age}</span></div>
                </div>
                <div className={styles.inform}>
                  <div className={styles.infoItem}><span className={styles.label}>Владелец:</span><span className={styles.value}>{patient.ownerName}</span></div>
                  <div className={styles.infoItem}><span className={styles.label}>Телефон:</span><span className={styles.value}>{patient.ownerPhone}</span></div>
                  <div className={styles.infoItem}><span className={styles.label}>Врач:</span><span className={styles.value}>{patient.doctor?.fullName || 'Не назначен'}</span></div>
                </div>
              </div>
            </div>

            <div className={styles.currentCare}>
              <h2>Текущий уход</h2>
              <div className={styles.careGrid}>
                <div className={styles.careItem}>
                  <span className={styles.label}>Дата следующего приёма:</span>
                  <span className={styles.value}>
                    {formatNextVisitDate(patient.nextVisitDate)}
                  </span>

                </div>
                <div className={styles.careItem}>
                  <span className={styles.label}>Диагноз:</span>
                  <span className={styles.value}>
                    {getLatestDiagnosis()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.visitsSection}>
            <div className={styles.visitsHeader}>
              <h2>История приёмов</h2>
              {patient.status === 'active' && (
                <button className={styles.addVisitButton} onClick={() => setShowAddVisit(!showAddVisit)}>
                  {showAddVisit ? 'Отмена' : 'Добавить приём'}
                </button>
              )}
            </div>

            {showAddVisit && (
              <div className={styles.addVisitForm}>
                <h3>Новый приём</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Дата приёма</label>
                    <input
                      type="date"
                      value={visitForm.date}
                      onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Дата следующего приёма</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={visitForm.nextVisitDate}
                      onChange={(e) => setVisitForm({ ...visitForm, nextVisitDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Состояние / Жалобы</label>
                  <textarea
                    value={visitForm.complaints}
                    onChange={(e) => setVisitForm({ ...visitForm, complaints: e.target.value.slice(0, 100) })}
                    rows="3"
                    maxLength="100"
                    placeholder="Опишите состояние пациента..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Лекарства</label>
                  <textarea
                    value={visitForm.medications}
                    onChange={(e) => setVisitForm({ ...visitForm, medications: e.target.value.slice(0, 100) })}
                    rows="2"
                    maxLength="100"
                    placeholder="Назначенные лекарства..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Показания к уходу</label>
                  <textarea
                    value={visitForm.careInstructions}
                    onChange={(e) => setVisitForm({ ...visitForm, careInstructions: e.target.value.slice(0, 100) })}
                    rows="2"
                    maxLength="100"
                    placeholder="Рекомендации по уходу..."
                  />
                </div>
                <button className={styles.saveVisitButton} onClick={handleAddVisit}>Сохранить приём</button>
              </div>
            )}

            <div className={styles.visitsList}>
              {visits.length === 0 ? (
                <p className={styles.noVisits}>История приёмов пуста</p>
              ) : (
                visits.map((visit, index) => (
                  <div key={visit.id} className={styles.visitCard}>
                    <div className={styles.visitHeader}>
                      <h3 style={{ fontFamily: 'Open Sans', color: '#034B70' }}>Приём #{visits.length - index}</h3>
                      <span className={styles.visitDate}>{new Date(visit.date).toLocaleDateString('ru-RU')}</span>
                    </div>

                    {visit.complaints && (
                      <div className={styles.visitItem}>
                        <span className={styles.visitLabel}>Состояние:</span>
                        <p className={styles.visitText}>{visit.complaints}</p>
                      </div>
                    )}

                    {visit.careInstructions && (
                      <div className={styles.visitItem}>
                        <span className={styles.visitLabel}>Показания к уходу:</span>
                        <p className={styles.visitText}>{visit.careInstructions}</p>
                      </div>
                    )}

                    {visit.treatments && visit.treatments.length > 0 && (
                      <div className={styles.visitItem}>
                        <span className={styles.visitLabel}>Лекарства:</span>
                        <p className={styles.visitText}>{visit.treatments[0].medicationName}</p>
                      </div>
                    )}

                    {visit.doctor && (
                      <div className={styles.visitItem}>
                        <span className={styles.visitLabel}>Врач:</span>
                        <span className={styles.visitText}>{visit.doctor.fullName}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPatientDetail;