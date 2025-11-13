// server.js
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import and use auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Users routes (get peran)
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Placeholder for routes
app.get('/', (req, res) => {
  res.send('User & Auth Service is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'auth', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`User & Auth Service is running on port ${PORT}`);
});