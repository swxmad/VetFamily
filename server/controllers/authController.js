const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const validateBirthDate = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) {
    return { valid: false, message: 'Некорректная дата' };
  }
  
  const day = birth.getDate();
  const month = birth.getMonth() + 1;
  const year = birth.getFullYear();
  
  if (day < 1 || day > 31) {
    return { valid: false, message: 'День должен быть от 1 до 31' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, message: 'Месяц должен быть от 1 до 12' };
  }
  
  if (year < 1926) {
    return { valid: false, message: 'Год рождения не может быть раньше 1926' };
  }
  
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  
  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    actualAge--;
  }
  
  if (actualAge < 18) {
    return { valid: false, message: 'Врач должен быть старше 18 лет' };
  }
  
  if (birth > today) {
    return { valid: false, message: 'Дата рождения не может быть в будущем' };
  }
  
  return { valid: true, age: actualAge };
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    console.log('Данные регистрации:', req.body);
    
    const { fullName, gender, birthDate, phone, email, password } = req.body;
    
    if (!fullName || !gender || !birthDate || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }
    
    const birthDateValidation = validateBirthDate(birthDate);
    if (!birthDateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: birthDateValidation.message
      });
    }
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email или телефоном уже существует'
      });
    }
    
    const user = await User.create({
      fullName,
      gender,
      birthDate,
      phone,
      email,
      password,
      role: 'doctor'
    });
    
    const token = generateToken(user.id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      user: user.safeData(),
      token
    });
    
  } catch (error) {
    console.error('Ошибка регистрации:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка сервера при регистрации'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Попытка входа:', { email, passwordLength: password?.length });

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('Пользователь не найден');
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    console.log('Пользователь найден:', { 
      email: user.email, 
      role: user.role,
      passwordHash: user.password.substring(0, 20) + '...' 
    });
    
    const isMatch = await user.comparePassword(password);
    
    console.log('Сравнение пароля:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Аккаунт деактивирован'
      });
    }
    
    const token = generateToken(user.id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: 'Вход успешен',
      user: user.safeData(),
      token
    });
    
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.json({
    success: true,
    message: 'Выход успешен'
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    res.json({
      success: true,
      user: user.safeData()
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Новый пароль должен содержать не менее 6 символов'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Для полноты операции: либо проверяем старый пароль, либо требуем подтверждение нового
    if (oldPassword && typeof oldPassword === 'string' && oldPassword.length > 0) {
      const ok = await user.comparePassword(oldPassword);
      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Старый пароль неверный'
        });
      }
    } else {
      if (!confirmNewPassword || confirmNewPassword !== newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Подтверждение нового пароля не совпадает'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Пароль успешно изменён'
    });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};