const { sequelize } = require('../config/database');
const Patient = require('../models/Patient');
const User = require('../models/User');

const checkPatients = async () => {
  try {
    await sequelize.authenticate();
    console.log('База данных подключена');
    
    const allPatients = await Patient.findAll({
      include: [{
        model: User,
        as: 'doctor',
        attributes: ['id', 'fullName', 'email']
      }]
    });
    
    console.log('Всего пациентов:', allPatients.length);
    allPatients.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (Врач ID: ${p.doctorId}, Статус: ${p.status})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
};

checkPatients();