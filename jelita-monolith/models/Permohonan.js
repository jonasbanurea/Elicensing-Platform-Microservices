// models/Permohonan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Permohonan = sequelize.define('Permohonan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nomor_registrasi: {
    type: DataTypes.STRING,
    unique: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_pemohon: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'permohonan',
  timestamps: false,
  indexes: [
    // Speeds up list queries by status during load
    { fields: ['status'] },
    // Speeds up user-scoped lookups
    { fields: ['user_id'] },
    // Helps ordered pagination by updated_at for status queries
    { fields: ['status', 'updated_at'] },
    { fields: ['updated_at'] }
  ],
});

module.exports = Permohonan;
