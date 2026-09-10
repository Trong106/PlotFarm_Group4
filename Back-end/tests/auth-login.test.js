const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

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
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const defaultUser = {
  UserId: 10,
  RoleId: 3,
  RoleName: 'Customer',
  FullName: 'Trần Thị Mai',
  Email: 'mai@example.com',
  PasswordPlain: 'MatKhau123!',
  PhoneNumber: '0912345678',
  AvatarUrl: null,
  Status: 'ACTIVE',
  CreatedAt: new Date('2026-09-10T08:00:00.000Z'),
};

const postLogin = async (payload, raw = false) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? payload : JSON.stringify(payload),
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  const body = await response.json();
  assert.equal(body.statusCode, response.status);
  assert.equal(body.success, response.ok);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
  return { status: response.status, body };
};

const getMe = async (tokenHeader) => {
  const headers = {};
  if (tokenHeader !== undefined) {
    headers.Authorization = tokenHeader;
  }
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'GET',
    headers,
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  const body = await response.json();
  assert.equal(body.statusCode, response.status);
  assert.equal(body.success, response.ok);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
  return { status: response.status, body };
};

const useDatabase = (t, options = {}) => {
  const calls = [];
  const pool = {
    request() {
      const params = {};
      return {
        input(name, type, value) {
          params[name] = value;
          return this;
        },
        async query(query) {
          calls.push({ query, params });
          if (options.databaseError) throw options.databaseError;

          if (query.includes('FROM Users') || query.includes('FROM') && query.includes('u.Email = @Email')) {
            if (options.userNotFound) {
              return { recordset: [] };
            }

            const mockUser = options.user || defaultUser;
            const passwordHash = options.passwordHash || (await bcrypt.hash(mockUser.PasswordPlain, 10));

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

          throw new Error(`Unexpected query in test: ${query}`);
        },
      };
    },
  };
  t.mock.method(db, 'getPool', () => pool);
  return { calls };
};

test('successful login returns 200, JWT token, and user profile', async (t) => {
  const database = useDatabase(t);

  const { status, body } = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
  });

  assert.equal(status, 200);
  assert.equal(body.message, 'Đăng nhập thành công');
  assert.equal(typeof body.data.token, 'string');
  assert.deepEqual(body.data.user, {
    userId: defaultUser.UserId,
    fullName: defaultUser.FullName,
    email: defaultUser.Email,
    roleId: defaultUser.RoleId,
    role: defaultUser.RoleName,
    phoneNumber: defaultUser.PhoneNumber,
    avatarUrl: defaultUser.AvatarUrl,
    status: 'ACTIVE',
    createdAt: defaultUser.CreatedAt.toISOString(),
  });

  // Verify database query received parameterized email
  assert.equal(database.calls.length, 1);
  assert.equal(database.calls[0].params.Email, defaultUser.Email);

  // Verify passwords or hashes are never leaked in the response
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes(defaultUser.PasswordPlain), false);
  assert.equal(serialized.includes('PasswordHash'), false);
});

test('login normalizes email: trim whitespace and convert to lowercase', async (t) => {
  const database = useDatabase(t);

  const { status, body } = await postLogin({
    email: '   MAI@EXAMPLE.COM   ',
    password: defaultUser.PasswordPlain,
  });

  assert.equal(status, 200);
  assert.equal(database.calls[0].params.Email, 'mai@example.com');
});

test('JWT token from login authenticates with GET /api/auth/me', async (t) => {
  useDatabase(t);

  const loginRes = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
  });
  assert.equal(loginRes.status, 200);
  const token = loginRes.body.data.token;

  const sessionRes = await getMe(`Bearer ${token}`);
  assert.equal(sessionRes.status, 200);
  assert.equal(sessionRes.body.message, 'Lấy thông tin phiên đăng nhập thành công');
  assert.deepEqual(sessionRes.body.data, {
    userId: defaultUser.UserId,
    role: defaultUser.RoleName,
    email: defaultUser.Email,
    fullName: defaultUser.FullName,
    iat: sessionRes.body.data.iat,
    exp: sessionRes.body.data.exp,
  });
  assert.ok(sessionRes.body.data.exp > sessionRes.body.data.iat);
});

test('validation rejects invalid fields with 400 before querying database', async (t) => {
  const getPool = t.mock.method(db, 'getPool', () => {
    throw new Error('database should not be called on validation failure');
  });

  const invalidCases = [
    [{}, 'email'],
    [{ email: 'invalid-email', password: 'password123' }, 'email'],
    [{ email: '', password: 'password123' }, 'email'],
    [{ email: 12345, password: 'password123' }, 'email'],
    [{ email: 'mai@example.com' }, 'password'],
    [{ email: 'mai@example.com', password: '' }, 'password'],
    [{ email: 'mai@example.com', password: 123456 }, 'password'],
    [{ email: 'mai@example.com', password: 'a'.repeat(73) }, 'password'],
  ];

  for (const [payload, field] of invalidCases) {
    const { status, body } = await postLogin(payload);
    assert.equal(status, 400, `Expected 400 for payload: ${JSON.stringify(payload)}`);
    assert.equal(body.message, 'Dữ liệu đăng nhập không hợp lệ');
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.some((err) => err.field === field), `Expected field error for ${field}`);
  }

  assert.equal(getPool.mock.callCount(), 0);
});

test('strips unknown client-injected fields during login', async (t) => {
  const database = useDatabase(t);

  const { status } = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
    role: 'Admin',
    status: 'ACTIVE',
    userId: 1,
    sqlInjection: "' OR '1'='1",
  });

  assert.equal(status, 200);
  assert.equal(database.calls.length, 1);
  assert.equal(database.calls[0].params.Email, defaultUser.Email);
  assert.equal(database.calls[0].params.role, undefined);
  assert.equal(database.calls[0].params.status, undefined);
});

test('returns 401 when email does not exist without leaking existence', async (t) => {
  useDatabase(t, { userNotFound: true });

  const { status, body } = await postLogin({
    email: 'nonexistent@example.com',
    password: 'AnyPassword123!',
  });

  assert.equal(status, 401);
  assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  assert.equal(body.errors, null);
});

test('returns 401 when password is incorrect', async (t) => {
  useDatabase(t);

  const { status, body } = await postLogin({
    email: defaultUser.Email,
    password: 'WrongPassword999!',
  });

  assert.equal(status, 401);
  assert.equal(body.message, 'Email hoặc mật khẩu không chính xác');
  assert.equal(body.errors, null);
});

test('returns 403 when account status is LOCKED', async (t) => {
  useDatabase(t, {
    user: { ...defaultUser, Status: 'LOCKED' },
  });

  const { status, body } = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
  });

  assert.equal(status, 403);
  assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  assert.equal(body.errors, null);
});

test('returns 403 when account status is PENDING', async (t) => {
  useDatabase(t, {
    user: { ...defaultUser, Status: 'PENDING' },
  });

  const { status, body } = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
  });

  assert.equal(status, 403);
  assert.equal(body.message, 'Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
  assert.equal(body.errors, null);
});

test('returns safe 500 without leaking SQL errors when database fails', async (t) => {
  useDatabase(t, {
    databaseError: new Error('Sensitive SQL connection string or query failed'),
  });
  t.mock.method(console, 'error', () => {});

  const { status, body } = await postLogin({
    email: defaultUser.Email,
    password: defaultUser.PasswordPlain,
  });

  assert.equal(status, 500);
  assert.equal(body.message, 'Lỗi máy chủ nội bộ (Internal Server Error)');
  assert.equal(body.errors, null);
  assert.equal(JSON.stringify(body).includes('Sensitive SQL'), false);
  assert.equal(body.stack, undefined);
});

test('GET /api/auth/me rejects request without Authorization header', async () => {
  const { status, body } = await getMe(undefined);
  assert.equal(status, 401);
  assert.equal(body.message, 'Yêu cầu Token xác thực hợp lệ (Bearer token)');
});

test('GET /api/auth/me rejects request with non-Bearer token', async () => {
  const { status, body } = await getMe('Basic some-credentials');
  assert.equal(status, 401);
  assert.equal(body.message, 'Yêu cầu Token xác thực hợp lệ (Bearer token)');
});

test('GET /api/auth/me rejects forged token with wrong signature', async () => {
  const forgedToken = jwt.sign(
    { userId: 999, role: 'Admin', email: 'hacker@example.com' },
    'Wrong_Secret_Key_For_Test'
  );

  const { status, body } = await getMe(`Bearer ${forgedToken}`);
  assert.equal(status, 401);
  assert.equal(body.message, 'Token không hợp lệ hoặc đã hết hạn');
});

test('GET /api/auth/me rejects expired token', async () => {
  const expiredToken = jwt.sign(
    { userId: defaultUser.UserId, role: defaultUser.RoleName, email: defaultUser.Email },
    process.env.JWT_SECRET || 'PlotFarm_Super_Secret_Key_2026_Team4',
    { expiresIn: '-1s' }
  );

  const { status, body } = await getMe(`Bearer ${expiredToken}`);
  assert.equal(status, 401);
  assert.equal(body.message, 'Token không hợp lệ hoặc đã hết hạn');
});

test('returns 400 for malformed JSON or empty body', async (t) => {
  const getPool = t.mock.method(db, 'getPool', () => { throw new Error('must not query'); });

  for (const payload of ['{"email":', '', 'null']) {
    const { status, body } = await postLogin(payload, true);
    assert.equal(status, 400);
    assert.equal(body.success, false);
  }

  assert.equal(getPool.mock.callCount(), 0);
});

