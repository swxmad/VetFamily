const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Treatment = sequelize.define('Treatment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicationName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  visitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Visits',
      key: 'id'
    }
  }
});

module.exports = Treatment;