const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const routes = require('./routes');
const { setupSwagger } = require('./config/swagger');
const { corsOptions } = require('./config/corsOptions');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Bật CORS cho Express với cấu hình chi tiết, an toàn và hỗ trợ credentials
app.use(cors(corsOptions));

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

// Error Handling Middlewares (Chuẩn hóa mã lỗi 400, 401, 403, 404, 500)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
