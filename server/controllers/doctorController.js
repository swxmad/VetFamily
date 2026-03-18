const { User, Patient, Visit, Diagnosis, Treatment, Owner } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getMyProfile = async (req, res) => {
  try {
    console.log('Запрос профиля, врач ID:', req.user?.id);

    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'fullName',
        'gender',
        'birthDate',
        'phone',
        'email',
        'role',
        'isActive',
        'createdAt'
      ]
    });

    console.log('Найден пользователь:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user: user.safeData ? user.safeData() : user
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const { fullName, gender, birthDate, phone, email } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone }
        ],
        id: { [Op.ne]: user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email или телефон уже используется'
      });
    }

    await user.update({
      fullName: fullName || user.fullName,
      gender: gender || user.gender,
      birthDate: birthDate || user.birthDate,
      phone: phone || user.phone,
      email: email || user.email
    });

    res.json({
      success: true,
      message: 'Данные обновлены',
      user: user.safeData()
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getMyPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      where: { doctorId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Visit,
          as: 'visits',
          attributes: ['id', 'date', 'status'],
          limit: 1,
          order: [['date', 'DESC']]
        },
        {
          model: Owner,
          as: 'owner'
        }
      ]
    });

    const mapped = patients.map((p) => {
      const data = p.toJSON();
      if (data.owner) {
        data.ownerName = data.owner.fullName;
        data.ownerPhone = data.owner.phone;
      }
      return data;
    });

    res.json({
      success: true,
      count: mapped.length,
      patients: mapped
    });
  } catch (error) {
    console.error('Ошибка получения пациентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

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

exports.createPatient = async (req, res) => {
  try {
    console.log('Создание пациента:', req.body);
    console.log('Текущий врач ID:', req.user.id);

    const {
      name, species, breed, age, ownerName, ownerPhone,
      complaints, diagnosis, medications,
      nextVisitDate, careInstructions
    } = req.body;

    if (!name || !species || !age || !ownerName || !ownerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Все обязательные поля должны быть заполнены'
      });
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

    const [owner] = await Owner.findOrCreate({
      where: {
        fullName: ownerName,
        phone: ownerPhone
      },
      defaults: {
        fullName: ownerName,
        phone: ownerPhone
      }
    });

    const patient = await Patient.create({
      name,
      species,
      breed: breed || null,
      age,
      ownerId: owner.id,
      nextVisitDate: nextVisitDate || null,
      careInstructions: careInstructions || null,
      doctorId: req.user.id,
      status: 'active'
    });

    if (complaints || diagnosis || medications) {
      const visit = await Visit.create({
        date: new Date(),
        complaints: complaints || null,
        patientId: patient.id,
        doctorId: req.user.id,
        status: 'active'
      });

      if (diagnosis) {
        await Diagnosis.create({
          description: diagnosis,
          visitId: visit.id
        });
      }

      if (medications) {
        await Treatment.create({
          medicationName: medications,
          visitId: visit.id
        });
      }
    }

    console.log('Пациент создан с ID:', patient.id);

    res.status(201).json({
      success: true,
      message: 'Пациент добавлен',
      patient
    });
  } catch (error) {
    console.error('Ошибка создания пациента:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Пациент добавлен',
    patient: patient.toJSON()
  });
};

exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    if (patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещён'
      });
    }

    const { name, species, breed, age, ownerName, ownerPhone, status } = req.body;

    await patient.update({
      name: name !== undefined ? name : patient.name,
      species: species !== undefined ? species : patient.species,
      breed: breed !== undefined ? breed : patient.breed,
      age: age !== undefined ? age : patient.age,
      status: status !== undefined ? status : patient.status
    });

    if (ownerName !== undefined || ownerPhone !== undefined) {
      if (patient.ownerId) {
        const owner = await Owner.findByPk(patient.ownerId);
        if (owner) {
          await owner.update({
            fullName: ownerName !== undefined ? ownerName : owner.fullName,
            phone: ownerPhone !== undefined ? ownerPhone : owner.phone
          });
        }
      } else if (ownerName && ownerPhone) {
        const [owner] = await Owner.findOrCreate({
          where: {
            fullName: ownerName,
            phone: ownerPhone
          },
          defaults: {
            fullName: ownerName,
            phone: ownerPhone
          }
        });
        await patient.update({ ownerId: owner.id });
      }
    }

    res.json({
      success: true,
      message: 'Данные пациента обновлены',
      patient
    });
  } catch (error) {
    console.error('Ошибка обновления пациента:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getPatientsByStatus = async (req, res) => {
  try {
    console.log('Запрос пациентов, статус:', req.query.status);
    console.log('Врач ID:', req.user?.id);

    const { status } = req.query;

    const patients = await Patient.findAll({
      where: {
        doctorId: req.user?.id,
        status: status || 'active'
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Visit,
          as: 'visits',
          attributes: ['id', 'date', 'status'],
          limit: 1,
          order: [['date', 'DESC']]
        },
        {
          model: Owner,
          as: 'owner'
        }
      ]
    });

    console.log('Найдено пациентов:', patients.length);

    const mapped = patients.map((p) => {
      const data = p.toJSON();
      if (data.owner) {
        data.ownerName = data.owner.fullName;
        data.ownerPhone = data.owner.phone;
      }
      return data;
    });

    res.json({
      success: true,
      count: mapped.length,
      patients: mapped
    });
  } catch (error) {
    console.error('Ошибка получения пациентов:', error);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера: ' + error.message
    });
  }
};

exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({ success: true, patients: [] });
    }

    const likeQuery = `%${q.trim()}%`;

    const patients = await Patient.findAll({
      where: {
        doctorId: req.user.id,
        [Op.or]: [
          { name: { [Op.like]: likeQuery } },
          sequelize.where(sequelize.col('owner.full_name'), { [Op.like]: likeQuery }),
          sequelize.where(sequelize.col('owner.phone'), { [Op.like]: likeQuery }),
          sequelize.where(sequelize.col('visits->diagnosis.description'), { [Op.like]: likeQuery })
        ]
      },
      include: [
        { model: Owner, as: 'owner', required: false },
        {
          model: Visit,
          as: 'visits',
          required: false,
          include: [{ model: Diagnosis, as: 'diagnosis', required: false }]
        }
      ],
      distinct: true,
      subQuery: false
    });

    const mapped = patients.map((p) => {
      const data = p.toJSON();
      if (data.owner) {
        data.ownerName = data.owner.fullName;
        data.ownerPhone = data.owner.phone;
      }
      return data;
    });

    res.json({
      success: true,
      count: mapped.length,
      patients: mapped
    });
  } catch (error) {
    console.error('Ошибка поиска пациентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера: ' + error.message
    });
  }
};

exports.getDoctorReport = async (req, res) => {
  try {
    const { from, to, doctorId } = req.query;

    const visitWhere = {};

    // Если врач — показываем только его данные
    if (req.user.role === 'doctor') {
      visitWhere.doctorId = req.user.id;
    }

    // Если админ — можно указать doctorId
    if (req.user.role === 'admin' && doctorId) {
      visitWhere.doctorId = doctorId;
    }

    // Если админ и doctorId НЕ указан — показываем всех врачей
    if (req.user.role === 'admin' && !doctorId) {
      // оставляем visitWhere пустым
    }

    if (from || to) {
      visitWhere.date = {};
      if (from) visitWhere.date[Op.gte] = from;
      if (to) visitWhere.date[Op.lte] = to;
    }

    const visits = await Visit.findAll({
      where: visitWhere,
      include: [{ model: Patient, as: 'patient' }]
    });

    const patientWhere = {};

    if (req.user.role === 'doctor') {
      patientWhere.doctorId = req.user.id;
    }

    if (req.user.role === 'admin' && doctorId) {
      patientWhere.doctorId = doctorId;
    }

    if (from || to) {
      patientWhere.createdAt = {};
      if (from) patientWhere.createdAt[Op.gte] = from;
      if (to) patientWhere.createdAt[Op.lte] = to;
    }

    const patients = await Patient.findAll({ where: patientWhere });

    const completedPatients = patients.filter(p => p.status === 'completed');

    res.json({
      success: true,
      data: {
        visitsCount: visits.length,
        patientsCount: patients.length,
        completedPatientsCount: completedPatients.length,
        visits
      }
    });
  } catch (error) {
    console.error('Ошибка формирования отчёта врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};


exports.completePatientTreatment = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    if (patient.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещён'
      });
    }

    if (patient.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Лечение уже завершено'
      });
    }

    await patient.update({ status: 'completed' });

    res.json({
      success: true,
      message: 'Лечение завершено',
      patient
    });
  } catch (error) {
    console.error('Ошибка завершения лечения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    if (patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещён'
      });
    }

    await patient.destroy();

    res.json({
      success: true,
      message: 'Пациент удалён'
    });
  } catch (error) {
    console.error('Ошибка удаления пациента:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    console.log('Запрос пациента ID:', req.params.id);
    console.log('Текущий врач ID:', req.user?.id);

    const patient = await Patient.findByPk(req.params.id, {
      include: [{
        model: Visit,
        as: 'visits',
        include: [
          { model: Diagnosis, as: 'diagnosis' },
          { model: Treatment, as: 'treatments' }
        ]
      }]
    });

    console.log('Найден пациент:', patient ? patient.name : 'null');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    if (patient.doctorId !== req.user.id && req.user.role !== 'admin') {
      console.log('Доступ запрещён: пациент принадлежит другому врачу');
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещён'
      });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('Ошибка получения пациента:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
  
};