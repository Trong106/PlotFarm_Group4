/**
 * @file corsOptions.js
 * @description Cấu hình CORS (Cross-Origin Resource Sharing) bảo mật và linh hoạt cho Express
 * Hệ thống: PlotFarm Team 4 - Express.js Backend
 */

/**
 * Lấy danh sách các Origin được phép truy cập từ biến môi trường hoặc danh sách mặc định
 * @returns {string[]}
 */
const getAllowedOrigins = () => {
  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];

  return Array.from(new Set([...defaultOrigins, ...envOrigins]));
};

/**
 * Cấu hình CORS chuẩn cho ứng dụng Express
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép các yêu cầu không có header Origin (như ứng dụng mobile, curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();

    // Kiểm tra nếu origin nằm trong danh sách được phép hoặc có ký tự đại diện '*'
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    return callback(new Error(`Nguồn gốc truy cập (Origin: ${origin}) bị chặn bởi chính sách CORS của PlotFarm.`));
  },

  // Cho phép truyền cookie và header xác thực (JWT Authorization) giữa các nguồn
  credentials: true,

  // Các phương thức HTTP được phép sử dụng
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Các Headers được phép gửi trong request
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Range',
  ],

  // Các Headers được phép hiển thị ra phía client
  exposedHeaders: [
    'Authorization',
    'Content-Range',
    'X-Content-Range',
    'Accept-Ranges',
    'Content-Length',
  ],

  // Mã phản hồi thành công cho preflight request OPTIONS (204 No Content là chuẩn HTTP hiện đại)
  optionsSuccessStatus: 204,

  // Thời gian lưu cache cho preflight response (giảm số lượng request OPTIONS)
  maxAge: 86400, // 24 giờ
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
};
