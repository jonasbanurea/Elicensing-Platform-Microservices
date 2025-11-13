// server.js
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import routes
const workflowRoutes = require('./routes/workflowRoutes');
app.use(workflowRoutes);

// Placeholder for routes
app.get('/', (req, res) => {
  res.send('Workflow Service is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'workflow', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Workflow Service is running on port ${PORT}`);
});