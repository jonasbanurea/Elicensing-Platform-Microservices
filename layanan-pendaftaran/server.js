// server.js
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import routes
const permohonanRoutes = require('./routes/permohonanRoutes');
app.use(permohonanRoutes);

// Placeholder for routes
app.get('/', (req, res) => {
  res.send('Application Service is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'pendaftaran', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Application Service is running on port ${PORT}`);
});