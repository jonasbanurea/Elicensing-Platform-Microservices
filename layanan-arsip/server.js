// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./utils/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3040;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✓ Database connection established'))
  .catch(err => console.error('✗ Database connection failed:', err));

// Routes
const archiveRoutes = require('./routes/archiveRoutes');
app.use(archiveRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Archive Service', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`Archive Service is running on port ${PORT}`);
});