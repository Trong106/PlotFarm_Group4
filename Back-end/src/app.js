const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const routes = require('./routes');
const { setupSwagger } = require('./config/swagger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads & public assets
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO Ping-Pong Diagnostic Test Page
app.get('/socket-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'socket-test.html'));
});

// Redirect root URL to Swagger Documentation
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// Swagger UI Documentation
setupSwagger(app);

// Base API Route
app.use('/api', routes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
