const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO Realtime Gateway
initSocket(server, app);

// Start Server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[INFO] Server running on port ${PORT}`);
    console.log(`[INFO] API Documentation: http://localhost:${PORT}/`);
    console.log(`[INFO] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[INFO] Socket.IO Test UI: http://localhost:${PORT}/socket-test`);
  });
};

startServer();
