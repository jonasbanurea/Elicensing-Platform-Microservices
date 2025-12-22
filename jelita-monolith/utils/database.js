// utils/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'jelita_monolith',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      // Allow more concurrent DB connections under load
      max: 200,
      min: 10,
      acquire: 120000,
      idle: 60000
    }
  }
);

module.exports = sequelize;
