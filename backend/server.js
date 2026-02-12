const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes         = require('./routes/auth');
const taskRoutes         = require('./routes/tasks');
const submissionRoutes   = require('./routes/submissions');
const paymentRoutes      = require('./routes/payments');
const userRoutes         = require('./routes/users');
const clientRoutes       = require('./routes/clients');
const adminRoutes        = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscriptions');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'trAIn API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth',          authRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/submissions',   submissionRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal Server Error', status: err.status || 500 } });
});

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

app.listen(PORT, () => {
  console.log(`🚀 trAIn API server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
