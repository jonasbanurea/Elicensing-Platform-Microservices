const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const RevisiDraft = sequelize.define('RevisiDraft', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  draft_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'draft_izin',
      key: 'id'
    }
  },
  diminta_oleh: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID Pimpinan yang meminta revisi'
  },
  catatan_revisi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'dikerjakan', 'selesai'),
    defaultValue: 'pending',
  },
  tanggal_revisi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  diselesaikan_oleh: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID Admin yang menyelesaikan revisi'
  },
  tanggal_selesai: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'revisi_draft',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RevisiDraft;
