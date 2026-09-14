const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const { generateToken } = require('../src/utils/jwtHelper');
const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} = require('../src/utils/appError');
const { getAllowedOrigins } = require('../src/config/corsOptions');

// Helper to make HTTP requests against the Express app in memory
const request = (appInstance, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appInstance);
    server.listen(0, () => {
      const { port } = server.address();
      const reqOptions = {
        hostname: '127.0.0.1',
        port,
        path: options.path || '/',
        method: options.method || 'GET',
        headers: { ...(options.headers || {}) },
      };

      let payload = null;
      if (body !== null) {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        if (!reqOptions.headers['Content-Type']) {
          reqOptions.headers['Content-Type'] = 'application/json';
        }
        reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(reqOptions, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          server.close(() => {
            let parsedBody = null;
            try {
              parsedBody = JSON.parse(rawData);
            } catch {
              parsedBody = rawData;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsedBody,
            });
          });
        });
      });

      req.on('error', (err) => {
        server.close(() => reject(err));
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
};

describe('CẤU HÌNH CORS VÀ CHUẨN HÓA MÃ LỖI (400, 401, 403, 404, 500)', () => {
  // --------------------------------------------------------------------------
  // 1. KIỂM THỬ CẤU HÌNH CORS
  // --------------------------------------------------------------------------
  describe('1. Cấu hình CORS cho Express', () => {
    test('1.1 Cho phép Origin hợp lệ (http://localhost:3000) và trả về header CORS credentials', async () => {
      const res = await request(app, {
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
    });

    test('1.2 Hỗ trợ Origin localhost thay thế (http://127.0.0.1:3000)', async () => {
      const res = await request(app, {
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'http://127.0.0.1:3000',
        },
      });

      assert.equal(res.headers['access-control-allow-origin'], 'http://127.0.0.1:3000');
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
    });

    test('1.3 Xử lý Preflight Request (OPTIONS) với mã trạng thái 204 và đầy đủ các Methods/Headers cho phép', async () => {
      const res = await request(app, {
        path: '/api/auth/login',
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      assert.equal(res.statusCode, 204);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
      assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
      assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
      assert.ok(res.headers['access-control-allow-methods'].includes('PATCH'));
      assert.ok(res.headers['access-control-allow-methods'].includes('DELETE'));
    });

    test('1.4 Danh sách allowed origins bao gồm các cổng phát triển chuẩn của Next.js', () => {
      const origins = getAllowedOrigins();
      assert.ok(origins.includes('http://localhost:3000'));
      assert.ok(origins.includes('http://127.0.0.1:3000'));
    });
  });

  // --------------------------------------------------------------------------
  // 2. KIỂM THỬ MÃ LỖI 400 BAD REQUEST
  // --------------------------------------------------------------------------
  describe('2. Chuẩn hóa mã lỗi 400 Bad Request', () => {
    test('2.1 Bắt lỗi cú pháp JSON hỏng trong body và trả về 400 chuẩn JSON', async () => {
      const res = await request(
        app,
        {
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        '{"email": "test@plotfarm.vn", invalid_json'
      );

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 400);
      assert.ok(res.body.message.includes('JSON không hợp lệ'));
      assert.ok(res.body.timestamp);
    });

    test('2.2 Bắt lỗi validation khi thiếu hoặc sai trường bắt buộc trả về 400 với mảng errors', async () => {
      const res = await request(
        app,
        {
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {} // Body rỗng
      );

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 400);
      assert.ok(res.body.message);
      assert.ok(res.body.timestamp);
    });
  });

  // --------------------------------------------------------------------------
  // 3. KIỂM THỬ MÃ LỖI 401 UNAUTHORIZED
  // --------------------------------------------------------------------------
  describe('3. Chuẩn hóa mã lỗi 401 Unauthorized', () => {
    test('3.1 Truy cập endpoint bảo vệ mà không gửi Authorization header trả về 401', async () => {
      const res = await request(app, {
        path: '/api/users/me',
        method: 'GET',
      });

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 401);
      assert.ok(res.body.message.includes('Token') || res.body.message.includes('xác thực'));
      assert.ok(res.body.timestamp);
    });

    test('3.2 Truy cập với Token giả mạo hoặc chữ ký sai trả về 401 chuẩn hóa', async () => {
      const res = await request(app, {
        path: '/api/users/me',
        method: 'GET',
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.invalidSignature',
        },
      });

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 401);
      assert.ok(res.body.timestamp);
    });
  });

  // --------------------------------------------------------------------------
  // 4. KIỂM THỬ MÃ LỖI 403 FORBIDDEN
  // --------------------------------------------------------------------------
  describe('4. Chuẩn hóa mã lỗi 403 Forbidden', () => {
    test('4.1 Tài khoản Customer truy cập tài nguyên Admin trả về 403 Forbidden', async () => {
      const customerToken = generateToken({
        userId: 9999,
        role: 'Customer',
        email: 'customer.test@plotfarm.vn',
        fullName: 'Customer Test',
      });

      const res = await request(app, {
        path: '/api/users',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 403);
      assert.ok(res.body.message.includes('từ chối') || res.body.message.includes('quyền'));
      assert.ok(res.body.timestamp);
    });
  });

  // --------------------------------------------------------------------------
  // 5. KIỂM THỬ MÃ LỖI 404 NOT FOUND
  // --------------------------------------------------------------------------
  describe('5. Chuẩn hóa mã lỗi 404 Not Found', () => {
    test('5.1 Gọi vào endpoint không tồn tại trả về 404 với thông điệp rõ ràng', async () => {
      const res = await request(app, {
        path: '/api/non-existent-resource-endpoint-xyz',
        method: 'GET',
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 404);
      assert.ok(res.body.message.includes('không tồn tại'));
      assert.ok(res.body.message.includes('/api/non-existent-resource-endpoint-xyz'));
      assert.ok(res.body.timestamp);
    });
  });

  // --------------------------------------------------------------------------
  // 6. KIỂM THỬ MÃ LỖI 500 INTERNAL SERVER ERROR
  // --------------------------------------------------------------------------
  describe('6. Chuẩn hóa và bảo mật mã lỗi 500 Internal Server Error', () => {
    test('6.1 Lỗi ngoại lệ hệ thống không được để lộ stack trace hay cú pháp SQL ra ngoài client', async (t) => {
      t.mock.method(console, 'error', () => {});

      // Tạo một route test phát sinh lỗi runtime unhandled
      const express = require('express');
      const testApp = express();
      testApp.get('/test-server-error', (req, res, next) => {
        const sensitiveError = new Error('Sensitive SQL database credentials Server=127.0.0.1;User=sa');
        next(sensitiveError);
      });
      const { errorHandler } = require('../src/middlewares/errorMiddleware');
      testApp.use(errorHandler);

      const res = await request(testApp, {
        path: '/test-server-error',
        method: 'GET',
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.success, false);
      assert.equal(res.body.statusCode, 500);
      assert.equal(res.body.message, 'Lỗi máy chủ nội bộ (Internal Server Error)');
      assert.equal(res.body.errors, null);
      // Đảm bảo thông tin nhạy cảm không xuất hiện trong JSON response
      assert.equal(JSON.stringify(res.body).includes('Sensitive SQL'), false);
      assert.equal(JSON.stringify(res.body).includes('Server=127.0.0.1'), false);
      assert.equal(res.body.stack, undefined);
    });
  });

  // --------------------------------------------------------------------------
  // 7. KIỂM THỬ CÁC LỚP LỖI CHUẨN HÓA (Custom AppError Classes)
  // --------------------------------------------------------------------------
  describe('7. Hệ thống lớp lỗi Custom AppError', () => {
    test('7.1 BadRequestError khởi tạo đúng statusCode 400', () => {
      const err = new BadRequestError('Dữ liệu không hợp lệ');
      assert.equal(err.statusCode, 400);
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Dữ liệu không hợp lệ');
      assert.equal(err.isOperational, true);
    });

    test('7.2 UnauthorizedError khởi tạo đúng statusCode 401', () => {
      const err = new UnauthorizedError('Chưa xác thực');
      assert.equal(err.statusCode, 401);
      assert.equal(err.status, 401);
    });

    test('7.3 ForbiddenError khởi tạo đúng statusCode 403', () => {
      const err = new ForbiddenError('Bị từ chối truy cập');
      assert.equal(err.statusCode, 403);
      assert.equal(err.status, 403);
    });

    test('7.4 NotFoundError khởi tạo đúng statusCode 404', () => {
      const err = new NotFoundError('Không tìm thấy ô đất');
      assert.equal(err.statusCode, 404);
      assert.equal(err.status, 404);
    });

    test('7.5 InternalServerError khởi tạo đúng statusCode 500', () => {
      const err = new InternalServerError('Lỗi nội bộ');
      assert.equal(err.statusCode, 500);
      assert.equal(err.status, 500);
    });
  });
});
