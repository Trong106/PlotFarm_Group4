const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start Server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[INFO] Server running on port ${PORT}`);
    console.log(`[INFO] API Documentation: http://localhost:${PORT}/`);
    console.log(`[INFO] Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
