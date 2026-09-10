const { Server } = require('socket.io');
const { socketAuthMiddleware, checkSocketRole } = require('../middlewares/socketMiddleware');

let io = null;

/**
 * Initialize Socket.IO with HTTP server instance and Express application
 * @param {import('http').Server} server - Node HTTP server instance
 * @param {import('express').Application} [app] - Express app instance to bind io
 * @returns {Server} Initialized Socket.IO server
 */
const initSocket = (server, app = null) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or test scripts)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in local development
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Attach io instance to Express app for access in controllers via req.app.get('io')
  if (app) {
    app.set('io', io);
  }

  // Đăng ký Middleware giải mã JWT Token cho mọi kết nối Socket.IO
  io.use(socketAuthMiddleware({ strict: false }));

  // Socket Connection Handlers
  io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    const user = socket.user || { isAnonymous: true, role: 'Guest' };

    console.log(
      `[Socket.IO] Client kết nối: ${socket.id} (IP: ${clientIp}) | Người dùng: ${
        user.isAnonymous ? 'Guest' : `#${user.userId} - ${user.fullName || user.email} [${user.role}]`
      }`
    );

    // Tự động phân luồng vào room theo User ID và Role nếu đã định danh
    if (!user.isAnonymous && user.userId) {
      socket.join(`user:${user.userId}`);
      socket.join(`role:${user.role}`);
      console.log(`[Socket.IO] ${socket.id} tự động vào room [user:${user.userId}] và [role:${user.role}]`);
    }

    // Gửi sự kiện welcome kèm định danh người dùng
    socket.emit('welcome', {
      message: 'Connected to PlotFarm Realtime Gateway',
      socketId: socket.id,
      user,
      serverTime: new Date().toISOString(),
    });

    /**
     * Sự kiện định danh: Kiểm tra thông tin user hiện tại của socket
     */
    socket.on('whoami', (callback) => {
      const response = {
        socketId: socket.id,
        user: socket.user,
        serverTime: new Date().toISOString(),
      };
      socket.emit('whoami_response', response);
      if (typeof callback === 'function') callback(response);
    });

    /**
     * Sự kiện Role-based: Thao tác yêu cầu quyền quản trị (Admin/Staff)
     */
    socket.on('admin_action', (data, callback) => {
      const isAllowed = checkSocketRole(socket, ['Admin', 'Staff']);
      if (!isAllowed) {
        const response = {
          success: false,
          statusCode: 403,
          message: 'Từ chối truy cập: Hành động này yêu cầu quyền Admin hoặc Staff.',
          user: socket.user,
        };
        socket.emit('admin_action_result', response);
        if (typeof callback === 'function') callback(response);
        return;
      }

      const response = {
        success: true,
        statusCode: 200,
        message: `Xác thực quyền [${socket.user.role}] thành công! Thực thi tác vụ quản trị realtime.`,
        executedBy: socket.user,
        data,
        timestamp: new Date().toISOString(),
      };
      socket.emit('admin_action_result', response);
      if (typeof callback === 'function') callback(response);
    });

    /**
     * Ping-Pong Test Event
     * Allows clients to test connectivity and measure round-trip latency (RTT)
     */
    socket.on('ping', (data, callback) => {
      const serverTime = Date.now();
      const clientTime = (data && typeof data === 'object') ? data.clientTime : (typeof data === 'number' ? data : null);
      const latency = clientTime ? (serverTime - clientTime) : null;

      const response = {
        event: 'pong',
        message: 'pong',
        socketId: socket.id,
        serverTime,
        clientTime,
        latency,
        payload: (data && typeof data === 'object' && data.payload) ? data.payload : data,
        timestamp: new Date().toISOString(),
      };

      // Emit pong back to client
      socket.emit('pong', response);

      // Support acknowledgment callback if client requested it
      if (typeof callback === 'function') {
        callback(response);
      }
    });

    /**
     * Echo Event - Replies back with whatever client sent
     */
    socket.on('echo', (data, callback) => {
      const response = {
        event: 'echo_reply',
        socketId: socket.id,
        data,
        serverTime: Date.now(),
        timestamp: new Date().toISOString(),
      };
      socket.emit('echo_reply', response);
      if (typeof callback === 'function') {
        callback(response);
      }
    });

    /**
     * Join Room Event (e.g. plot:1, farm:2, notifications)
     */
    socket.on('join_room', (room, callback) => {
      if (room) {
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
        const response = { status: 'success', room, message: `Joined room ${room}` };
        socket.emit('room_joined', response);
        if (typeof callback === 'function') callback(response);
      }
    });

    /**
     * Leave Room Event
     */
    socket.on('leave_room', (room, callback) => {
      if (room) {
        socket.leave(room);
        console.log(`[Socket.IO] Socket ${socket.id} left room: ${room}`);
        const response = { status: 'success', room, message: `Left room ${room}` };
        socket.emit('room_left', response);
        if (typeof callback === 'function') callback(response);
      }
    });

    /**
     * Broadcast to Room Event
     */
    socket.on('broadcast_to_room', ({ room, event, data }) => {
      if (room && event) {
        socket.to(room).emit(event, {
          sender: socket.id,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Handle Disconnection
     */
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    /**
     * Handle Socket Errors
     */
    socket.on('error', (err) => {
      console.error(`[Socket.IO] Error on socket ${socket.id}:`, err);
    });
  });

  return io;
};

/**
 * Get the initialized Socket.IO instance
 * @returns {Server} Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
