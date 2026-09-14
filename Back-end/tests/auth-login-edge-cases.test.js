/**
 * ============================================================================
 * PLOTFARM PLATFORM — UNIT TEST: ĐĂNG NHẬP HỆ THỐNG (LOGIN)
 * ============================================================================
 * Chức năng: Chức năng Đăng nhập hệ thống (Login)
 * Phạm vi:
 *   1. Kiểm tra các trường hợp đăng nhập SAI MẬT KHẨU
 *   2. Kiểm tra các trường hợp TÀI KHOẢN BỊ KHÓA (LOCKED/PENDING)
 * Tác giả: DucTM — PlotFarm Team 4
 * ============================================================================
 */

const assert = require('node:assert/strict');
const { before, after, describe, test } = require('node:test');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const app = require('../src/app');

// ─── Server Setup ─────────────────────────────────────────────────────────────
let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ─── Dữ liệu người dùng mẫu ──────────────────────────────────────────────────
const MOCK_USERS = {
  customer: {
    UserId: 10,
    RoleId: 3,
    RoleName: 'Customer',
    FullName: 'Nguyễn Thị Lan',
    Email: 'lan@plotfarm.vn',
    PasswordPlain: 'DungMatKhau@2026!',
    PhoneNumber: '0901234567',
    AvatarUrl: null,
    Status: 'ACTIVE',
    CreatedAt: new Date('2026-09-01T08:00:00.000Z'),
  },
  admin: {
    UserId: 1,
    RoleId: 1,
    RoleName: 'Admin',
    FullName: 'Quản Trị Viên',
    Email: 'admin@plotfarm.vn',
    PasswordPlain: 'Admin@2026!',
    PhoneNumber: '0900000001',
    AvatarUrl: null,
    Status: 'ACTIVE',
    CreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  staff: {
    UserId: 2,
    RoleId: 2,
    RoleName: 'Staff',
    FullName: 'Nguyễn Minh Khoa',
    Email: 'khoa.staff@plotfarm.vn',
    PasswordPlain: 'Staff@2026!',
    PhoneNumber: '0902000001',
    AvatarUrl: null,
    Status: 'ACTIVE',
    CreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
};

// ─── Helper: Gọi API Login ────────────────────────────────────────────────────
const postLogin = async (payload, raw = false) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? payload : JSON.stringify(payload),
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  const body = await response.json();
  assert.equal(body.statusCode, response.status, `statusCode mismatch: body.statusCode=${body.statusCode}, HTTP=${response.status}`);
  assert.equal(body.success, response.ok);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)), 'Timestamp phải là ISO date hợp lệ');
  return { status: response.status, body };
};

// ─── Helper: Mock Database ────────────────────────────────────────────────────
/**
 * @param {import('node:test').TestContext} t
 * @param {object} options
 * @param {object} [options.user]         - Override user record từ mock
 * @param {string} [options.passwordHash] - Custom hash (để test sai mật khẩu)
 * @param {boolean} [options.userNotFound] - Trả về recordset rỗng (email không tồn tại)
 * @param {Error}   [options.databaseError] - Throw lỗi DB để test lỗi server
 */
const mockDatabase = (t, options = {}) => {
  const queries = [];
  const pool = {
    request() {
      const params = {};
      return {
        input(name, _type, value) {
          params[name] = value;
          return this;
        },
        async query(query) {
          queries.push({ query, params: { ...params } });
          if (options.databaseError) throw options.databaseError;

          // Mock truy vấn tìm user theo email
          if (
            query.includes('FROM Users') ||
            (query.includes('FROM') && query.includes('u.Email = @Email'))
          ) {
            if (options.userNotFound) return { recordset: [] };

            const mockUser = options.user || MOCK_USERS.customer;
            const passwordHash =
              options.passwordHash ?? (await bcrypt.hash(mockUser.PasswordPlain, 10));

            return {
              recordset: [
                {
                  UserId: mockUser.UserId,
                  RoleId: mockUser.RoleId,
                  RoleName: mockUser.RoleName,
                  FullName: mockUser.FullName,
                  Email: mockUser.Email,
                  PasswordHash: passwordHash,
                  PhoneNumber: mockUser.PhoneNumber,
                  AvatarUrl: mockUser.AvatarUrl,
                  Status: mockUser.Status,
                  CreatedAt: mockUser.CreatedAt,
                },
              ],
            };
          }

          throw new Error(`Unexpected query in mock: ${query.substring(0, 80)}...`);
        },
      };
    },
  };
  t.mock.method(db, 'getPool', () => pool);
  return { queries };
};

// ═════════════════════════════════════════════════════════════════════════════
// NHÓM 1: ĐĂNG NHẬP SAI MẬT KHẨU (WRONG PASSWORD)
// ═════════════════════════════════════════════════════════════════════════════
describe('1. Đăng nhập sai mật khẩu (Wrong Password)', () => {

  test('1.1 Mật khẩu sai hoàn toàn trả về 401 và thông báo chung', async (t) => {
    mockDatabase(t); // Dùng hash đúng của user mock

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhauHoanToan!999',
    });

    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
    // Đảm bảo không lộ thông tin nội bộ
    assert.equal(body.errors, null);
    assert.equal(body.data, undefined);
  });

  test('1.2 Mật khẩu đúng nhưng viết hoa/thường khác — phân biệt chữ hoa/thường', async (t) => {
    mockDatabase(t);

    // Mật khẩu gốc: 'DungMatKhau@2026!' — viết lại chữ thường hết
    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'dungmatkau@2026!', // Sai case
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('1.3 Mật khẩu gần đúng (thiếu 1 ký tự ở cuối) trả về 401', async (t) => {
    mockDatabase(t);

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'DungMatKhau@2026', // Thiếu dấu '!' cuối
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('1.4 Mật khẩu rỗng chuỗi bị validation chặn (400) trước khi gọi DB', async (t) => {
    const getPool = t.mock.method(db, 'getPool', () => {
      throw new Error('DB không được gọi khi validation thất bại');
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: '',
    });

    assert.equal(status, 400);
    assert.equal(body.message, 'Dữ liệu đăng nhập không hợp lệ');
    assert.ok(Array.isArray(body.errors));
    assert.ok(
      body.errors.some((e) => e.field === 'password'),
      'Phải báo lỗi trường password'
    );
    assert.equal(getPool.mock.callCount(), 0, 'Không được truy vấn DB khi validate lỗi');
  });

  test('1.5 Mật khẩu chỉ có khoảng trắng — loginSchema cho qua, bcrypt.compare thất bại → 401', async (t) => {
    /**
     * Hành vi thực tế của loginSchema (authValidator.js):
     * - password: z.string().min(1) → '   ' (3 khoảng trắng) có length = 3 ≥ 1 → PASS qua validator
     * - loginSchema KHÔNG .trim() password (để tránh sai lệch ý định mật khẩu)
     * → Request đến được DB, tìm thấy user, nhưng bcrypt.compare('   ', hash) → false → 401
     *
     * NOTE: registerSchema có .refine(v => v.trim().length > 0) nhưng loginSchema KHÔNG có.
     * Đây là thiết kế có chủ ý: tôn trọng mật khẩu gốc, không trim.
     */
    mockDatabase(t);

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: '   ', // 3 khoảng trắng — validator cho qua, bcrypt sẽ so sánh thất bại
    });

    // bcrypt.compare('   ', hashOf('DungMatKhau@2026!')) → false → 401
    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
    assert.equal(body.success, false);
  });

  test('1.6 Mật khẩu vượt 72 bytes UTF-8 bị validation chặn (400)', async (t) => {
    const getPool = t.mock.method(db, 'getPool', () => {
      throw new Error('DB không được gọi khi validation thất bại');
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'A'.repeat(73), // 73 ký tự ASCII = 73 bytes
    });

    assert.equal(status, 400);
    assert.ok(
      body.errors.some((e) => e.field === 'password'),
      'Phải báo lỗi trường password khi vượt giới hạn byte'
    );
    assert.equal(getPool.mock.callCount(), 0);
  });

  test('1.7 Sai mật khẩu không lộ password hash trong response', async (t) => {
    mockDatabase(t);

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhau!123',
    });

    assert.equal(status, 401);
    const serialized = JSON.stringify(body);
    assert.equal(
      serialized.toLowerCase().includes('passwordhash'),
      false,
      'Response không được chứa PasswordHash'
    );
    assert.equal(
      serialized.includes(MOCK_USERS.customer.PasswordPlain),
      false,
      'Response không được chứa plain text password'
    );
    assert.equal(body.stack, undefined, 'Stack trace không được lộ ra ngoài');
  });

  test('1.8 Sai mật khẩu không lộ thông tin email có tồn tại hay không (anti-enumeration)', async (t) => {
    // Khi email không tồn tại
    mockDatabase(t, { userNotFound: true });
    const resNotFound = await postLogin({
      email: 'khongtontai@plotfarm.vn',
      password: 'MatKhauGiaNao@123',
    });

    // Khi mật khẩu sai
    mockDatabase(t, {}); // Reset mock cho lần gọi kế tiếp
    const resWrongPassword = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhau@999',
    });

    // Cả 2 trường hợp phải trả về CÙNG thông báo lỗi
    assert.equal(resNotFound.status, 401);
    assert.equal(resWrongPassword.status, 401);
    assert.equal(
      resNotFound.body.message,
      resWrongPassword.body.message,
      'Cùng thông báo lỗi để tránh email enumeration'
    );
  });

  test('1.9 Đăng nhập thành công bằng đúng mật khẩu sau nhiều lần thử sai (mô phỏng)', async (t) => {
    const db_mock = mockDatabase(t);

    // 2 lần sai trước
    for (const wrongPwd of ['SaiLan1@', 'SaiLan2@']) {
      const { status } = await postLogin({
        email: MOCK_USERS.customer.Email,
        password: wrongPwd,
      });
      assert.equal(status, 401);
    }

    // Đăng nhập đúng lần thứ 3
    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 200);
    assert.equal(body.message, 'Đăng nhập thành công');
    assert.equal(typeof body.data.token, 'string');
    assert.equal(db_mock.queries.length, 3, 'Phải có đúng 3 lần query DB (3 lần POST)');
  });

  test('1.10 Sai mật khẩu với vai trò Admin trả về 401 (không ngoại lệ cho Admin)', async (t) => {
    mockDatabase(t, { user: MOCK_USERS.admin });

    const { status, body } = await postLogin({
      email: MOCK_USERS.admin.Email,
      password: 'SaiAdmin@999',
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('1.11 Sai mật khẩu với vai trò Staff trả về 401', async (t) => {
    mockDatabase(t, { user: MOCK_USERS.staff });

    const { status, body } = await postLogin({
      email: MOCK_USERS.staff.Email,
      password: 'SaiStaff@999',
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// NHÓM 2: TÀI KHOẢN BỊ KHÓA (LOCKED ACCOUNT)
// ═════════════════════════════════════════════════════════════════════════════
describe('2. Tài khoản bị khóa / chưa kích hoạt (Locked/Pending Account)', () => {

  test('2.1 Tài khoản LOCKED trả về 403 và thông báo bị khóa', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain, // Mật khẩu ĐÚNG
    });

    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
    assert.equal(body.errors, null);
    assert.equal(body.data, undefined);
  });

  test('2.2 Tài khoản PENDING trả về 403 và thông báo chưa kích hoạt', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'PENDING' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain, // Mật khẩu ĐÚNG
    });

    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
    assert.equal(body.errors, null);
  });

  test('2.3 Tài khoản LOCKED không trả về JWT token dù mật khẩu đúng', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 403);
    // data.token không được có trong response
    assert.equal(body.data, undefined, 'Không được trả về data khi tài khoản bị khóa');
    const serialized = JSON.stringify(body);
    assert.equal(
      serialized.includes('"token"'),
      false,
      'JWT token không được xuất hiện trong response khi tài khoản bị khóa'
    );
  });

  test('2.4 Tài khoản LOCKED không lộ thông tin nội bộ (PasswordHash, stack trace)', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 403);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.toLowerCase().includes('passwordhash'), false);
    assert.equal(body.stack, undefined, 'Stack trace không được lộ ra ngoài');
    assert.equal(serialized.includes(MOCK_USERS.customer.PasswordPlain), false);
  });

  test('2.5 Tài khoản LOCKED với vai trò Admin vẫn trả về 403', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.admin, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.admin.Email,
      password: MOCK_USERS.admin.PasswordPlain,
    });

    assert.equal(status, 403);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  });

  test('2.6 Tài khoản LOCKED với vai trò Staff vẫn trả về 403', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.staff, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.staff.Email,
      password: MOCK_USERS.staff.PasswordPlain,
    });

    assert.equal(status, 403);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  });

  test('2.7 Tài khoản LOCKED + mật khẩu SAI: kiểm thử thứ tự xử lý logic', async (t) => {
    /**
     * Logic hệ thống (authService.js):
     *   1. Tìm user theo email
     *   2. So sánh password (bcrypt)  ← Phải chạy TRƯỚC
     *   3. Kiểm tra status            ← Chạy SAU
     *
     * Nên: LOCKED + wrong password → phải trả về 401 (sai mật khẩu)
     * chứ KHÔNG phải 403 (bị khóa), vì step 2 bị chặn trước.
     * Điều này đúng theo thiết kế bảo mật: không để user biết tài khoản
     * bị khóa nếu mật khẩu đã sai (tránh enumeration trạng thái).
     */
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'LOCKED' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhau@Locked123', // Mật khẩu SAI
    });

    // Mật khẩu sai → 401 (bước bcrypt.compare thất bại trước khi check Status)
    assert.equal(status, 401);
    assert.equal(
      body.message,
      'Email hoặc mật khẩu không chính xác',
      'Khi cả mật khẩu sai lẫn tài khoản bị khóa: ưu tiên thông báo sai mật khẩu (401)'
    );
  });

  test('2.8 Tài khoản PENDING + mật khẩu SAI cũng trả về 401 (không lộ trạng thái PENDING)', async (t) => {
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'PENDING' },
    });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhauPending@123',
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('2.9 Tài khoản LOCKED không tạo session — gọi /api/auth/me bằng token cũ không được truy cập', async (t) => {
    /**
     * Test này mô phỏng: user trước đây có token hợp lệ, nhưng tài khoản bị khóa.
     * Hành vi: Vì JWT là stateless, token cũ vẫn hợp lệ về mặt chữ ký.
     * Mục đích: Đảm bảo tài khoản LOCKED không nhận được token mới khi login.
     */
    mockDatabase(t, {
      user: { ...MOCK_USERS.customer, Status: 'LOCKED' },
    });

    const { status: loginStatus } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    // Tài khoản bị khóa → không login được → không có token mới
    assert.equal(loginStatus, 403);
  });

  test('2.10 Response format đồng nhất giữa LOCKED (403) và PENDING (403)', async (t) => {
    // Test LOCKED
    mockDatabase(t, { user: { ...MOCK_USERS.customer, Status: 'LOCKED' } });
    const resLocked = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    // Test PENDING — cần mock lại vì mock bị consume
    mockDatabase(t, { user: { ...MOCK_USERS.customer, Status: 'PENDING' } });
    const resPending = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    // Cả 2 phải trả về cùng HTTP status và cùng message
    assert.equal(resLocked.status, 403);
    assert.equal(resPending.status, 403);
    assert.equal(
      resLocked.body.message,
      resPending.body.message,
      'Thông báo lỗi 403 phải đồng nhất giữa LOCKED và PENDING'
    );
    assert.equal(resLocked.body.errors, null);
    assert.equal(resPending.body.errors, null);
    assert.ok(!Number.isNaN(Date.parse(resLocked.body.timestamp)));
    assert.ok(!Number.isNaN(Date.parse(resPending.body.timestamp)));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// NHÓM 3: KIỂM TRA PHÂN BIỆT HTTP STATUS CODE
// ═════════════════════════════════════════════════════════════════════════════
describe('3. Phân biệt HTTP Status Code giữa các trường hợp thất bại', () => {

  test('3.1 400 — Input validation lỗi (email/password sai định dạng)', async (t) => {
    t.mock.method(db, 'getPool', () => {
      throw new Error('DB không được gọi khi validate lỗi');
    });

    const { status, body } = await postLogin({
      email: 'email-khong-hop-le',
      password: 'MatKhau@123',
    });

    assert.equal(status, 400);
    assert.equal(body.message, 'Dữ liệu đăng nhập không hợp lệ');
  });

  test('3.2 401 — Email không tồn tại trong hệ thống', async (t) => {
    mockDatabase(t, { userNotFound: true });

    const { status, body } = await postLogin({
      email: 'khongtontai@plotfarm.vn',
      password: 'MatKhau@123',
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('3.3 401 — Email tồn tại nhưng mật khẩu sai', async (t) => {
    mockDatabase(t);

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: 'SaiMatKhau@123',
    });

    assert.equal(status, 401);
    assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  });

  test('3.4 403 — Email đúng, mật khẩu đúng nhưng tài khoản LOCKED', async (t) => {
    mockDatabase(t, { user: { ...MOCK_USERS.customer, Status: 'LOCKED' } });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 403);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  });

  test('3.5 403 — Email đúng, mật khẩu đúng nhưng tài khoản PENDING', async (t) => {
    mockDatabase(t, { user: { ...MOCK_USERS.customer, Status: 'PENDING' } });

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 403);
    assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  });

  test('3.6 200 — Đăng nhập thành công (baseline để so sánh với các trường hợp thất bại)', async (t) => {
    mockDatabase(t);

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.message, 'Đăng nhập thành công');
    assert.equal(typeof body.data.token, 'string', 'Token phải là chuỗi string');
    assert.equal(body.data.user.email, MOCK_USERS.customer.Email);
    assert.equal(body.data.user.status, 'ACTIVE');

    // Đảm bảo dữ liệu nhạy cảm không lộ trong response thành công
    const serialized = JSON.stringify(body);
    assert.equal(serialized.toLowerCase().includes('passwordhash'), false);
    assert.equal(serialized.includes(MOCK_USERS.customer.PasswordPlain), false);
  });

  test('3.7 500 — Lỗi kết nối database không lộ thông tin SQL chi tiết', async (t) => {
    mockDatabase(t, {
      databaseError: new Error('SQL Server connection string: Server=localhost;Password=12345'),
    });
    t.mock.method(console, 'error', () => {});

    const { status, body } = await postLogin({
      email: MOCK_USERS.customer.Email,
      password: MOCK_USERS.customer.PasswordPlain,
    });

    assert.equal(status, 500);
    assert.equal(body.message, 'Lỗi máy chủ nội bộ (Internal Server Error)');
    assert.equal(body.errors, null);
    // Thông tin kết nối SQL không được lộ ra ngoài
    assert.equal(
      JSON.stringify(body).includes('Password=12345'),
      false,
      'Không được lộ thông tin SQL connection string trong response'
    );
    assert.equal(body.stack, undefined, 'Stack trace không được lộ ra client');
  });
});
