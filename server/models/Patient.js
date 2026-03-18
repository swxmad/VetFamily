const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const russianTextRegex = /^[А-Яа-яЁё\s-]+$/;

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: {
        args: [1, 20],
        msg: 'Кличка должна содержать не более 20 символов'
      },
      isRussian(value) {
        if (!russianTextRegex.test(value)) {
          throw new Error('Кличка должна содержать только русские буквы, пробелы и дефисы');
        }
      }
    }
  },
  species: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      len: {
        args: [1, 30],
        msg: 'Вид должен содержать не более 30 символов'
      },
      isRussian(value) {
        if (!russianTextRegex.test(value)) {
          throw new Error('Вид должен содержать только русские буквы, пробелы и дефисы');
        }
      }
    }
  },
  breed: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      len: {
        args: [0, 30],
        msg: 'Порода должна содержать не более 30 символов'
      },
      isRussian(value) {
        if (value && !russianTextRegex.test(value)) {
          throw new Error('Порода должна содержать только русские буквы, пробелы и дефисы');
        }
      }
    }
  },
  age: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      len: {
        args: [1, 15],
        msg: 'Возраст должен содержать не более 15 символов'
      }
    }
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Owners',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  nextVisitDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  careInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

Patient.associate = (models) => {
  Patient.belongsTo(models.User, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });

  Patient.belongsTo(models.Owner, {
    foreignKey: 'ownerId',
    as: 'owner'
  });

  Patient.hasMany(models.Visit, {
    foreignKey: 'patientId',
    as: 'visits'
  });
};


module.exports = Patient;