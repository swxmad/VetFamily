const { User, Patient, Visit, Diagnosis, Treatment, Owner } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения (JPG, PNG, GIF)'));
    }
  }
});

exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'fullName', 'gender', 'birthDate', 'phone', 'email', 'role', 'isActive', 'createdAt']
    });

    res.json({
      success: true,
      user: user.safeData()
    });
  } catch (error) {
    console.error('Ошибка получения профиля админа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.updateAdminProfile = async (req, res) => {
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
        [Op.or]: [{ email }, { phone }],
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

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: ['id', 'fullName', 'email', 'phone', 'gender', 'birthDate', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Ошибка получения врачей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findByPk(req.params.id, {
      attributes: ['id', 'fullName', 'email', 'phone', 'gender', 'birthDate', 'role', 'isActive', 'createdAt']
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Врач не найден'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является врачом'
      });
    }

    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Ошибка получения врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getDoctorPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      where: { doctorId: req.params.id },
      include: [{
        model: User,
        as: 'doctor',
        attributes: ['id', 'fullName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    console.error('Ошибка получения пациентов врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await User.findByPk(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Врач не найден'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является врачом'
      });
    }

    const { fullName, gender, birthDate, phone, email, isActive } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
        id: { [Op.ne]: doctor.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email или телефон уже используется другим пользователем'
      });
    }

    await doctor.update({
      fullName: fullName !== undefined ? fullName : doctor.fullName,
      gender: gender !== undefined ? gender : doctor.gender,
      birthDate: birthDate !== undefined ? birthDate : doctor.birthDate,
      phone: phone !== undefined ? phone : doctor.phone,
      email: email !== undefined ? email : doctor.email,
      isActive: isActive !== undefined ? isActive : doctor.isActive
    });

    res.json({
      success: true,
      message: 'Данные врача обновлены',
      doctor: doctor.safeData()
    });
  } catch (error) {
    console.error('Ошибка обновления врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    await sequelize.transaction(async (t) => {
      const doctor = await User.findByPk(req.params.id, { transaction: t });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Врач не найден'
        });
      }

      if (doctor.role !== 'doctor') {
        return res.status(400).json({
          success: false,
          message: 'Можно удалять только врачей'
        });
      }

      const patients = await Patient.findAll({
        where: { doctorId: doctor.id },
        attributes: ['id'],
        transaction: t
      });
      const patientIds = patients.map((p) => p.id);

      if (patientIds.length > 0) {
        const visits = await Visit.findAll({
          where: { patientId: { [Op.in]: patientIds } },
          attributes: ['id'],
          transaction: t
        });
        const visitIds = visits.map((v) => v.id);

        if (visitIds.length > 0) {
          await Diagnosis.destroy({ where: { visitId: { [Op.in]: visitIds } }, transaction: t });
          await Treatment.destroy({ where: { visitId: { [Op.in]: visitIds } }, transaction: t });
          await Visit.destroy({ where: { id: { [Op.in]: visitIds } }, transaction: t });
        }

        await Patient.destroy({ where: { id: { [Op.in]: patientIds } }, transaction: t });
      }

      await doctor.destroy({ transaction: t });

      res.json({
        success: true,
        message: 'Врач удалён из системы'
      });
    });
  } catch (error) {
    console.error('Ошибка удаления врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Owner,
          as: 'owner'
        }
      ],
      order: [['createdAt', 'DESC']]
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

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      attributes: [
        'id',
        'name',
        'species',
        'breed',
        'age',
        'status',
        'nextVisitDate',
        'careInstructions',
        'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Owner,
          as: 'owner'
        },
        {
          model: Visit,
          as: 'visits',
          separate: true,
          order: [['date', 'DESC']],
          include: [
            { model: Diagnosis, as: 'diagnosis' },
            { model: Treatment, as: 'treatments' },
            { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
          ]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    const data = patient.toJSON();

    if (data.owner) {
      data.ownerName = data.owner.fullName;
      data.ownerPhone = data.owner.phone;
    }

    res.json({
      success: true,
      patient: data
    });
  } catch (error) {
    console.error('Ошибка получения пациента (админ):', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
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

    const { name, species, breed, age, ownerName, ownerPhone, status, doctorId } = req.body;

    await patient.update({
      name: name !== undefined ? name : patient.name,
      species: species !== undefined ? species : patient.species,
      breed: breed !== undefined ? breed : patient.breed,
      age: age !== undefined ? age : patient.age,
      status: status !== undefined ? status : patient.status,
      doctorId: doctorId !== undefined ? doctorId : patient.doctorId
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

exports.completePatientTreatmentAdmin = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
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
    console.error('Ошибка завершения лечения (админ):', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.restorePatientStatus = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Пациент не найден'
      });
    }

    if (patient.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Можно вернуть в активные только завершённые карты'
      });
    }

    await patient.update({ status: 'active' });

    res.json({
      success: true,
      message: 'Карта пациента возвращена в активные',
      patient
    });
  } catch (error) {
    console.error('Ошибка возврата статуса пациента (админ):', error);
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

    await patient.destroy();

    res.json({
      success: true,
      message: 'Пациент удалён из системы'
    });
  } catch (error) {
    console.error('Ошибка удаления пациента:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.resetDoctorPassword = async (req, res) => {
  try {
    const doctor = await User.findByPk(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Врач не найден'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является врачом'
      });
    }

    const { newPassword, adminPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Новый пароль должен содержать не менее 6 символов'
      });
    }

    if (!adminPassword || typeof adminPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Для сброса пароля необходимо ввести пароль администратора'
      });
    }

    const admin = await User.findByPk(req.user.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Только администратор может сбрасывать пароли врачей'
      });
    }

    const isAdminPasswordValid = await admin.comparePassword(adminPassword);

    if (!isAdminPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный пароль администратора'
      });
    }

    doctor.password = newPassword;
    await doctor.save();

    res.json({
      success: true,
      message: 'Пароль врача успешно сброшен'
    });
  } catch (error) {
    console.error('Ошибка сброса пароля врача:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
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
        [Op.or]: [
          { name: { [Op.like]: likeQuery } },
          sequelize.where(sequelize.col('owner.full_name'), { [Op.like]: likeQuery }),
          sequelize.where(sequelize.col('owner.phone'), { [Op.like]: likeQuery }),
          sequelize.where(sequelize.col('visits->diagnosis.description'), { [Op.like]: likeQuery })
        ]
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Owner,
          as: 'owner',
          required: false
        },
        {
          model: Visit,
          as: 'visits',
          required: false,
          include: [
            {
              model: Diagnosis,
              as: 'diagnosis',
              required: false
            }
          ]
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
    console.error('Ошибка поиска пациентов (админ):', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.getAdminReports = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) dateFilter.date[Op.gte] = from;
      if (to) dateFilter.date[Op.lte] = to;
    }

    const totalVisits = await Visit.count({
      where: {
        ...(Object.keys(dateFilter).length ? dateFilter : {})
      }
    });

    const totalPatients = await Visit.count({
      where: {
        ...(Object.keys(dateFilter).length ? dateFilter : {})
      },
      attributes: ['patientId'],
      distinct: true,
      col: 'patientId'
    });

    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: ['id', 'fullName', 'email'],
      include: [
        {
          model: Patient,
          as: 'patients',
          attributes: [],
          required: false
        }
      ]
    });

    const doctorStats = await Promise.all(
      doctors.map(async (doctor) => {
        const visitsCount = await Visit.count({
          where: {
            doctorId: doctor.id,
            ...(Object.keys(dateFilter).length ? dateFilter : {})
          }
        });

        const patientsCount = await Patient.count({
          where: { doctorId: doctor.id }
        });

        return {
          doctor: {
            id: doctor.id,
            fullName: doctor.fullName,
            email: doctor.email
          },
          visitsCount,
          patientsCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalVisits,
        totalPatients,
        byDoctor: doctorStats
      }
    });

  } catch (error) {
    console.error('Ошибка получения отчёта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера: ' + error.message
    });
  }
};
