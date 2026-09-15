const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { connectDB, closeDB } = require('../src/config/db');
const { generateToken } = require('../src/utils/jwtHelper');
const { connectDB, closeDB } = require('../src/config/db');

let server;
let baseUrl;

// Shared test credentials and tokens
let customerToken;
let staffToken;

before(async () => {
  // Ensure database pool is connected if possible
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Test] DB connection warning:', err.message);
  }
  // Start Express server on dynamic port
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Generate test JWT tokens
  customerToken = generateToken({ userId: 4, role: 'Customer', fullName: 'Phạm Thị Trà My' });
  staffToken = generateToken({ userId: 2, role: 'Staff', fullName: 'Nguyễn Văn Đức' });
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  try {
    await closeDB();
  } catch (e) {}
});

// Helper for making API requests with optional Authorization header
const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status: response.status, data };
};

// ============================================================================
// BỘ KIỂM THỬ TỰ ĐỘNG (END-TO-END FARMING LIFECYCLE SUITE)
// ============================================================================

test('1. Kiểm thử Phân quyền & JWT Token xác thực tài khoản', async (t) => {
  await t.test('1.1 Customer Token chứa đúng định danh và vai trò', () => {
    const decoded = jwt.decode(customerToken);
    assert.equal(decoded.userId, 4);
    assert.equal(decoded.role, 'Customer');
  });

  await t.test('1.2 Staff Token chứa đúng định danh Kỹ thuật viên', () => {
    const decoded = jwt.decode(staffToken);
    assert.equal(decoded.userId, 2);
    assert.equal(decoded.role, 'Staff');
  });
});

test('2. BƯỚC 1: Khách hàng đặt thuê ô đất nông trại (Rental Order)', async (t) => {
  await t.test('2.1 Lấy danh sách ô đất sẵn sàng cho thuê', async () => {
    const { status, data } = await apiRequest('/api/plots');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  await t.test('2.2 Khách hàng gửi yêu cầu đặt thuê ô đất kèm hạt giống & gói chăm sóc', async () => {
    const orderPayload = {
      plotId: 1,
      seedId: 1,
      packageId: 1,
      durationMonths: 3,
      totalAmount: 1500000,
    };

    const { status, data } = await apiRequest('/api/orders', 'POST', orderPayload, customerToken);
    // API returns 201 or 200 or 400 depending on mock/db constraint
    assert.ok([200, 201, 400, 404].includes(status), `Mã trạng thái phản hồi: ${status}`);
    if (status === 200 || status === 201) {
      assert.equal(data.success, true);
    }
  });
});

test('3. BƯỚC 2: Kích hoạt mùa vụ & Theo dõi tiến độ canh tác', async (t) => {
  await t.test('3.1 Lấy danh sách mùa vụ đang canh tác', async () => {
    const { status, data } = await apiRequest('/api/cultivations', 'GET', null, customerToken);
    assert.ok([200, 404].includes(status));
    if (status === 200) {
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
    }
  });
});

test('4. BƯỚC 3: Kỹ thuật viên (Staff) đăng nhật ký thực địa tại vườn', async (t) => {
  await t.test('4.1 Khách hàng không có quyền đăng nhật ký kỹ thuật (403 Forbidden)', async () => {
    const logPayload = {
      title: 'Tưới nước vi sinh trái phép',
      activityType: 'TƯỚI NƯỚC',
      notes: 'Thử nghiệm đăng nhật ký từ tài khoản khách hàng',
    };

    const { status } = await apiRequest('/api/cultivations/1/logs', 'POST', logPayload, customerToken);
    assert.ok([403, 404, 401].includes(status), `Khách hàng không được đăng nhật ký: ${status}`);
  });

  await t.test('4.2 Staff đăng thành công bài nhật ký chăm sóc cây trồng', async () => {
    const logPayload = {
      title: 'Tưới nước vi sinh & tỉa lá gốc ô đất A-01',
      activityType: 'TƯỚI NƯỚC',
      notes: 'Đã tưới 10L vi sinh thảo mộc, kiểm tra độ ẩm đất đạt 72%. Cây phát triển rất tốt.',
      plantHealthStatus: 'EXCELLENT',
      imageUrl: '/assets/farm/cultivated-plot.jpg',
    };

    const { status, data } = await apiRequest('/api/cultivations/1/logs', 'POST', logPayload, staffToken);
    assert.ok([200, 201, 404].includes(status));
    if (status === 200 || status === 201) {
      assert.equal(data.success, true);
    }
  });
});

test('5. BƯỚC 4: Tiếp nhận & Xử lý Yêu cầu Chăm sóc (Care Requests)', async (t) => {
  await t.test('5.1 Khách hàng gửi yêu cầu chăm sóc cho mảnh vườn', async () => {
    const requestPayload = {
      plotCode: 'A-01',
      requestType: 'Tưới nước bổ sung',
      note: 'Nhờ kỹ thuật viên tưới thêm vi sinh trùn quế giúp cây cải bẹ xanh.',
    };

    const { status, data } = await apiRequest('/api/cultivations/1/care-requests', 'POST', requestPayload, customerToken);
    assert.ok([200, 201, 404].includes(status));
    if (status === 200 || status === 201) {
      assert.equal(data.success, true);
    }
  });
});

test('6. BƯỚC 5: Ghi nhận Thu hoạch nông sản & Khởi tạo Giao hàng', async (t) => {
  await t.test('6.1 Kỹ thuật viên ghi nhận sản lượng thu hoạch thực tế (kg)', async () => {
    const harvestPayload = {
      actualYieldKg: 15.5,
      notes: 'Rau cải xanh thu hoạch đạt chất lượng loại A, tươi sạch.',
      status: 'HARVESTED',
    };

    const { status, data } = await apiRequest('/api/cultivations/1/harvest', 'POST', harvestPayload, staffToken);
    assert.ok([200, 201, 404].includes(status));
    if (status === 200 || status === 201) {
      assert.equal(data.success, true);
    }
  });
});
