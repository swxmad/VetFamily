const { sequelize } = require('../config/database');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('База данных подключена');

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });

    if (existingAdmin) {
      console.log('ℹАдминистратор уже существует');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    await User.create({
      fullName: 'Администратор Системы',
      gender: 'male',
      birthDate: '1990-01-01',
      phone: '+7 (999) 999-99-99',
      email: 'admin@vetclinic.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    console.log('Администратор создан успешно!');
    console.log('Email: admin@vetclinic.com');
    console.log('Пароль: admin123');
    console.log('Пароль будет автоматически захеширован моделью User');

    process.exit(0);
  } catch (error) {
    console.error('Ошибка создания админа:', error);
    process.exit(1);
  }
};

createAdmin();