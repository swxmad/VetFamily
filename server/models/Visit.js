const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  complaints: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextVisitDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  careInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

Visit.associate = (models) => {
  Visit.belongsTo(models.User, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });

  Visit.belongsTo(models.Patient, {
    foreignKey: 'patientId',
    as: 'patient'
  });

  Visit.hasOne(models.Diagnosis, {
    foreignKey: 'visitId',
    as: 'diagnosis'
  });

  Visit.hasMany(models.Treatment, {
    foreignKey: 'visitId',
    as: 'treatments'
  });
};


module.exports = Visit;