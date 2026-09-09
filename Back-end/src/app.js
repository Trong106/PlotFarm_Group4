const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

// Serve static uploads
app.use('/uploads', express.static('uploads'));

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
