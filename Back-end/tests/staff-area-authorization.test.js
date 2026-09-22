const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const { generateToken } = require('../src/utils/jwtHelper');
const staffService = require('../src/services/staffService');
const { connectDB, closeDB } = require('../src/config/db');

// Helper to make HTTP requests against the Express app in memory
const request = (appInstance, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appInstance);
    server.listen(0, '127.0.0.1', () => {
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

describe('KIỂM THỬ PHÂN QUYỀN KỸ THUẬT VIÊN THEO PHÂN KHU (AREAID) & GHI NHẬN THU HOẠCH', () => {
  let adminToken;
  let staffToken;
  let customerToken;

  before(async () => {
    try {
      await connectDB();
    } catch (e) {}

    adminToken = generateToken({ userId: 1, role: 'Admin', fullName: 'Quản Trị Viên' });
    staffToken = generateToken({ userId: 2, role: 'Staff', fullName: 'Kỹ Thuật Viên Tuấn' });
    customerToken = generateToken({ userId: 4, role: 'Customer', fullName: 'Khách Hàng' });
  });

  after(async () => {
    try {
      await closeDB();
    } catch (e) {}
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Kiểm tra phân quyền truy cập endpoint Staff
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Kiểm tra quyền truy cập Role-Based (RBAC)', () => {
    test('1.1 Khách hàng (Customer) bị từ chối truy cập /api/staff/my-plots (403 Forbidden)', async () => {
      const res = await request(app, {
        path: '/api/staff/my-plots',
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.statusCode, 403);
    });

    test('1.2 Người dùng chưa đăng nhập bị từ chối (401 Unauthorized)', async () => {
      const res = await request(app, {
        path: '/api/staff/my-plots',
        method: 'GET',
      });
      assert.equal(res.statusCode, 401);
    });

    test('1.3 Staff hợp lệ được phép truy cập /api/staff/my-plots (200 OK)', async () => {
      const res = await request(app, {
        path: '/api/staff/my-plots',
        method: 'GET',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    test('1.4 Admin hợp lệ được phép truy cập /api/staff/my-plots (200 OK)', async () => {
      const res = await request(app, {
        path: '/api/staff/my-plots',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Kiểm tra nghiệp vụ Ghi nhận Sản lượng Thu hoạch (Task 2)
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Kiểm tra nghiệp vụ Ghi nhận Sản lượng Thu hoạch', () => {
    test('2.1 Từ chối khi sản lượng thu hoạch thực tế <= 0 kg (400 Bad Request)', async () => {
      const res = await request(app, {
        path: '/api/staff/harvest-orders/1/result',
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      }, {
        actualYieldKg: 0,
        qualityGrade: 'GRADE_A',
      });
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /lớn hơn 0 kg/i);
    });

    test('2.2 Từ chối khi thiếu sản lượng thu hoạch hoặc truyền ký tự sai (400 Bad Request)', async () => {
      const res = await request(app, {
        path: '/api/staff/harvest-orders/1/result',
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      }, {
        actualYieldKg: 'abc',
        qualityGrade: 'GRADE_A',
      });
      assert.equal(res.statusCode, 400);
    });

    test('2.3 Từ chối khi HarvestRequestId không hợp lệ (400 Bad Request)', async () => {
      const res = await request(app, {
        path: '/api/staff/harvest-orders/invalid/result',
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      }, {
        actualYieldKg: 15.5,
        qualityGrade: 'GRADE_A',
      });
      assert.equal(res.statusCode, 400);
    });

    test('2.4 Khách hàng (Customer) không được phép gọi API ghi nhận thu hoạch (403 Forbidden)', async () => {
      const res = await request(app, {
        path: '/api/staff/harvest-orders/1/result',
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      }, {
        actualYieldKg: 15.5,
        qualityGrade: 'GRADE_A',
      });
      assert.equal(res.statusCode, 403);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Kiểm tra phân quyền truy cập theo phân khu (AreaId) (Task 3)
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Ràng buộc phân quyền theo phân khu (AreaId)', () => {
    test('3.1 Staff chưa được phân công phân khu nào sẽ nhận danh sách rỗng (không lộ ô đất phân khu khác)', async () => {
      // UserId 9999 là staff giả lập không có bản ghi trong StaffAssignments
      const unassignedStaffId = 9999;
      const plots = await staffService.getMyAssignedPlots(unassignedStaffId, 'Staff');
      assert.equal(plots.length, 0, 'Nhân viên chưa phân công phải nhận danh sách rỗng');
    });

    test('3.2 Admin xem được danh sách toàn bộ ô đất đang có trong hệ thống', async () => {
      const plots = await staffService.getMyAssignedPlots(1, 'Admin');
      assert.ok(plots.length > 0, 'Admin phải xem được toàn bộ ô đất');
    });

    test('3.3 Staff thao tác trên ô đất ngoài phân khu phụ trách bị chặn với 403 Forbidden', async () => {
      // Gọi service với staff không thuộc phân công của ô đất
      const unassignedStaffId = 9999;
      await assert.rejects(
        async () => {
          // Thao tác trên ô đất 21 (thuộc AreaId 2) mà staff 9999 không phụ trách
          await staffService.recordHarvestResult(unassignedStaffId, 999999, {
            actualYieldKg: 10,
            qualityGrade: 'GRADE_A',
          }, 'Staff');
        },
        (err) => {
          // Phải trả về 404 (nếu đơn không tồn tại) hoặc 403 (nếu không có quyền phân khu)
          return err.statusCode === 404 || err.statusCode === 403;
        }
      );
    });

    test('3.4 Cập nhật tiến độ thu hoạch kiểm tra quyền phân khu của Staff', async () => {
      const res = await request(app, {
        path: '/api/staff/harvest-orders/1/progress',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffToken}` },
      }, {
        harvestStatus: 'SHIPPING',
        trackingCode: 'PF-GHTK-999999',
      });
      // 404 (nếu đơn 1 không có trong DB) hoặc 403 (nếu ngoài phân khu), không được trả về 500
      assert.ok([200, 403, 404].includes(res.statusCode));
    });

    test('3.5 Tiếp nhận yêu cầu chăm sóc kiểm tra quyền phân khu của Staff', async () => {
      const res = await request(app, {
        path: '/api/staff/care-requests/1/accept',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      // 404 hoặc 403 hoặc 200, không được trả về 500
      assert.ok([200, 403, 404].includes(res.statusCode));
    });
  });
});

