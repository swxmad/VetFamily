const { Visit, Diagnosis, Treatment, Patient, User, Owner } = require('../models');
const { Op } = require('sequelize');

const validateTextLength = (value, fieldName, max = 300) => {
  if (value && value.length > max) {
    return `${fieldName} не должно превышать ${max} символов`;
  }
  return null;
};

const isPastDate = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const valueDate = new Date(dateString);
  valueDate.setHours(0, 0, 0, 0);
  return valueDate < today;
};

exports.createVisit = async (req, res) => {
  try {
    const { patientId, date, time, complaints, diagnosis, medications, nextVisitDate, careInstructions } = req.body;
    
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Пациент не найден' });
    }
    
    if (patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }

    if (nextVisitDate && isPastDate(nextVisitDate)) {
      return res.status(400).json({
        success: false,
        message: 'Дата следующего приёма не может быть раньше сегодняшней'
      });
    }

    const complaintsError = validateTextLength(complaints, 'Жалобы / состояние');
    const diagnosisError = validateTextLength(diagnosis, 'Диагноз');
    const medicationsError = validateTextLength(medications, 'Лекарства');
    const careError = validateTextLength(careInstructions, 'Показания к уходу');

    const errors = [complaintsError, diagnosisError, medicationsError, careError].filter(Boolean);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const visit = await Visit.create({
      date: date || new Date(),
      time: time || null,
      complaints,
      patientId,
      doctorId: req.user.id,
      status: 'active',
      type: 'actual'
    });
    
   if (diagnosis) {
  await Diagnosis.create({
    description: diagnosis,
    visitId: visit.id
  });

  await patient.update({ currentDiagnosis: diagnosis });
}

    
    if (medications) {
      await Treatment.create({
        medicationName: medications,
        visitId: visit.id
      });
    }
    
    await patient.update({ nextVisitDate, careInstructions });
    
    const fullVisit = await Visit.findByPk(visit.id, {
      include: [
        { model: Diagnosis, as: 'diagnosis' },
        { model: Treatment, as: 'treatments' },
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'fullName', 'email'] }
      ]
    });
    
    res.status(201).json({ success: true, message: 'Визит создан', visit: fullVisit });
  } catch (error) {
    console.error('Ошибка создания визита:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

exports.getPatientVisits = async (req, res) => {
  try {
    const visits = await Visit.findAll({
      where: { patientId: req.params.patientId },
      order: [['date', 'DESC']],
      include: [
        { model: Diagnosis, as: 'diagnosis' },
        { model: Treatment, as: 'treatments' },
        { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
      ]
    });

    res.json({ success: true, visits });
  } catch (error) {
    console.error('Ошибка получения визитов:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }

  include: [
  { model: Diagnosis, as: 'diagnosis' },
  { model: Treatment, as: 'treatments' },
  { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
]

};


exports.updateVisit = async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.visitId, {
      include: [{ model: Patient, as: 'patient' }]
    });
    
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Визит не найден' });
    }
    
    if (visit.patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }
    
    const { complaints, diagnosis, medications, nextVisitDate, careInstructions, date, time, status } = req.body;

    if (nextVisitDate && isPastDate(nextVisitDate)) {
      return res.status(400).json({
        success: false,
        message: 'Дата следующего приёма не может быть раньше сегодняшней'
      });
    }

    const complaintsError = validateTextLength(complaints, 'Жалобы / состояние');
    const diagnosisError = validateTextLength(diagnosis, 'Диагноз');
    const medicationsError = validateTextLength(medications, 'Лекарства');
    const careError = validateTextLength(careInstructions, 'Показания к уходу');

    const errors = [complaintsError, diagnosisError, medicationsError, careError].filter(Boolean);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }
    
    await visit.update({
      complaints: complaints !== undefined ? complaints : visit.complaints,
      date: date !== undefined ? date : visit.date,
      time: time !== undefined ? time : visit.time,
      status: status !== undefined ? status : visit.status
    });
    
   if (diagnosis) {
  const existingDiagnosis = await Diagnosis.findOne({ where: { visitId: visit.id } });
  if (existingDiagnosis) {
    await existingDiagnosis.update({ description: diagnosis });
  } else {
    await Diagnosis.create({ description: diagnosis, visitId: visit.id });
  }

  await visit.patient.update({ currentDiagnosis: diagnosis });
}

    
    if (medications) {
      const existingTreatment = await Treatment.findOne({ where: { visitId: visit.id } });
      if (existingTreatment) {
        await existingTreatment.update({ medicationName: medications });
      } else {
        await Treatment.create({ medicationName: medications, visitId: visit.id });
      }
    }
    
    await visit.patient.update({ nextVisitDate, careInstructions });
    
    const updatedVisit = await Visit.findByPk(visit.id, {
      include: [
        { model: Diagnosis, as: 'diagnosis' },
        { model: Treatment, as: 'treatments' },
        { model: User, as: 'doctor', attributes: ['id', 'fullName', 'email'] }
      ]
    });
    
    res.json({ success: true, message: 'Визит обновлён', visit: updatedVisit });
  } catch (error) {
    console.error('Ошибка обновления визита:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.visitId, {
      include: [{ model: Patient, as: 'patient' }]
    });
    
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Визит не найден' });
    }
    
    if (visit.patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }
    
    await visit.destroy();
    
    res.json({ success: true, message: 'Визит удалён' });
  } catch (error) {
    console.error('Ошибка удаления визита:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const { from, to, doctorId, search } = req.query;

    const where = {
      status: { [Op.in]: ['active', 'planned'] }
    };

    // Врач видит только свои записи
    if (req.user.role === 'doctor') {
      where.doctorId = req.user.id;
    }

    // Админ может выбрать врача
    if (req.user.role === 'admin' && doctorId) {
      where.doctorId = doctorId;
    }

    // Админ без doctorId видит всех врачей
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const visits = await Visit.findAll({
      where,
      order: [['date', 'ASC'], ['time', 'ASC']],
      include: [
        {
          model: Patient,
          as: 'patient',
          where: search
            ? { name: { [Op.iLike]: `%${search}%` } }
            : undefined,
          include: [
            { model: Owner, as: 'owner' },
            { model: User, as: 'doctor', attributes: ['id', 'fullName', 'email'] }
          ]
        }
      ]
    });

    const mapped = visits.map((v) => {
      const data = v.toJSON();
      if (data.patient && data.patient.owner) {
        data.patient.ownerName = data.patient.owner.fullName;
        data.patient.ownerPhone = data.patient.owner.phone;
      }
      return data;
    });

    res.json({
      success: true,
      count: mapped.length,
      visits: mapped
    });
  } catch (error) {
    console.error('Ошибка получения расписания:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};



exports.createPlannedVisit = async (req, res) => {
  try {
    const { patientId, date, time, complaints } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Пациент не найден' });
    }

    if (patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Нужно указать дату' });
    }

    const visit = await Visit.create({
      date,
      time: time || null,
      complaints: complaints || null,
      patientId,
      doctorId: req.user.id,
      status: 'planned',
      type: 'planned'
    });

    res.status(201).json({
      success: true,
      message: 'Запись создана',
      visit
    });
  } catch (error) {
    console.error('Ошибка создания записи:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
