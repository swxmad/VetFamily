const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const russianNameRegex = /^[А-Яа-яЁё\s-]+$/;

const User = sequelize.define('User', {
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
                msg: 'ФИО должно содержать от 1 до 100 символов'
            },
            isRussian(value) {
                if (!russianNameRegex.test(value)) {
                    throw new Error('ФИО должно содержать только русские буквы, пробелы и дефисы');
                }
            }
        }
    },
    gender: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING, 
        defaultValue: 'doctor'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

User.prototype.comparePassword = async function(candidatePassword) {
  console.log('Сравнение паролей:', { 
    candidateLength: candidatePassword?.length,
    hashLength: this.password?.length 
  });
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Результат:', isMatch);
  
  return isMatch;
};

User.prototype.safeData = function() {
  const data = this.toJSON();
  delete data.password;
  return data;
};

User.associate = (models) => {
  User.hasMany(models.Visit, {
    foreignKey: 'doctorId',
    as: 'visits'
  });

  User.hasMany(models.Patient, {
    foreignKey: 'doctorId',
    as: 'patients'
  });
};


module.exports = User;