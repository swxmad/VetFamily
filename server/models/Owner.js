const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const russianNameRegex = /^[А-Яа-яЁё\s-]+$/;

const Owner = sequelize.define('Owner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: 'ФИО владельца должно содержать от 1 до 100 символов'
      },
      isRussian(value) {
        if (!russianNameRegex.test(value)) {
          throw new Error('ФИО владельца должно содержать только русские буквы, пробелы и дефисы');
        }
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Owner;

