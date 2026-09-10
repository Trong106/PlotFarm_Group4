const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const bcrypt = require('bcryptjs');
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

const validInput = {
  fullName: 'Nguyễn Văn An',
  email: 'an@example.com',
  password: 'MatKhau123!',
  phoneNumber: '0901234567',
};

const post = async (payload, raw = false) => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
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

// Exercise real HTTP middleware, controllers, validation and bcrypt. Only SQL
// Server I/O is replaced, so tests cannot write to a developer's database.
const useDatabase = (t, options = {}) => {
  const calls = [];
  const users = new Map();
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
          if (query.includes('SELECT UserId')) {
            return { recordset: options.existingEmail ? [{ UserId: 1 }] : [] };
          }
          if (query.includes('SELECT RoleId')) {
            assert.equal(params.RoleName, 'Customer');
            return { recordset: options.missingRole ? [] : [{ RoleId: 7, RoleName: 'Customer' }] };
          }
          assert.match(query, /INSERT INTO Users/);
          assert.equal(params.RoleId, 7, 'must use the Customer role from SQL, not a hardcoded/client role');
          assert.ok(!query.includes(params.Email), 'email must be a SQL parameter');
          assert.ok(!query.includes(params.FullName), 'full name must be a SQL parameter');
          if (options.insertError) throw options.insertError;
          if (users.has(params.Email)) {
            throw Object.assign(new Error('Violation of UNIQUE KEY constraint UQ_Users_Email'), { number: 2627 });
          }
          const user = {
            UserId: users.size + 1,
            FullName: params.FullName,
            Email: params.Email,
            RoleId: params.RoleId,
            CreatedAt: new Date('2026-09-10T00:00:00.000Z'),
          };
          users.set(params.Email, { ...user, PasswordHash: params.PasswordHash });
          return { recordset: [user] };
        },
      };
    },
  };
  t.mock.method(db, 'getPool', () => pool);
  return { calls, users };
};

test('creates a Customer, normalizes input, hashes password and returns the standard 201 response', async (t) => {
  const database = useDatabase(t);
  const { status, body } = await post({
    ...validInput,
    fullName: `  ${validInput.fullName}  `,
    email: '  AN@EXAMPLE.COM  ',
    phoneNumber: '  +84901234567  ',
    role: 'Admin',
    roleId: 1,
    status: 'LOCKED',
    PasswordHash: 'client-controlled-hash',
  });
  assert.equal(status, 201);
  assert.deepEqual(body.data.user, {
    userId: 1,
    fullName: validInput.fullName,
    email: validInput.email,
    roleId: 7,
    role: 'Customer',
    createdAt: '2026-09-10T00:00:00.000Z',
  });
  assert.equal(typeof body.data.token, 'string');
  const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${body.data.token}` },
  });
  assert.equal(sessionResponse.status, 200, 'registration JWT must authenticate with the API');
  const session = (await sessionResponse.json()).data;
  assert.equal(session.userId, body.data.user.userId);
  assert.equal(session.email, validInput.email);
  assert.equal(session.role, 'Customer');
  assert.ok(session.exp > session.iat);
  const insert = database.calls.find(({ query }) => query.includes('INSERT INTO Users'));
  assert.equal(insert.params.PhoneNumber, '+84901234567');
  assert.match(insert.query, /'ACTIVE'/);
  const hash = database.users.get(validInput.email).PasswordHash;
  assert.notEqual(hash, validInput.password);
  assert.equal(bcrypt.getRounds(hash), 10);
  assert.equal(await bcrypt.compare(validInput.password, hash), true);
  assert.equal(await bcrypt.compare('wrong-password', hash), false);
  assert.equal(JSON.stringify(body).includes(hash), false);
  assert.equal(JSON.stringify(body).includes(validInput.password), false);
});

test('rejects invalid fields before any database call', async (t) => {
  const getPool = t.mock.method(db, 'getPool', () => { throw new Error('validation must run first'); });
  const invalidInputs = [
    [{}, 'fullName'],
    [{ ...validInput, fullName: '   ' }, 'fullName'],
    [{ ...validInput, fullName: 123 }, 'fullName'],
    [{ ...validInput, fullName: 'A'.repeat(101) }, 'fullName'],
    [{ ...validInput, email: 'invalid-email' }, 'email'],
    [{ ...validInput, email: ['an@example.com'] }, 'email'],
    [{ ...validInput, email: `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(20)}.com` }, 'email'],
    [{ ...validInput, password: 12345678 }, 'password'],
    [{ ...validInput, password: '1234567' }, 'password'],
    [{ ...validInput, password: '        ' }, 'password'],
    [{ ...validInput, password: 'a'.repeat(73) }, 'password'],
    [{ ...validInput, password: 'á'.repeat(37) }, 'password'],
    [{ ...validInput, phoneNumber: 901234567 }, 'phoneNumber'],
    [{ ...validInput, phoneNumber: '09012abc67' }, 'phoneNumber'],
    [{ ...validInput, phoneNumber: '123' }, 'phoneNumber'],
    [[], 'body'],
  ];
  for (const [payload, field] of invalidInputs) {
    const { status, body } = await post(payload);
    assert.equal(status, 400, JSON.stringify(payload));
    assert.ok(body.errors.some((error) => error.field === field));
    assert.ok(body.errors.every((error) => typeof error.message === 'string'));
  }
  assert.equal(getPool.mock.callCount(), 0);
});

test('accepts an omitted, empty or null optional phone number', async (t) => {
  const database = useDatabase(t);
  for (const [index, phoneNumber] of [undefined, '', null].entries()) {
    const { status } = await post({ ...validInput, email: `phone${index}@example.com`, phoneNumber });
    assert.equal(status, 201);
  }
  const inserts = database.calls.filter(({ query }) => query.includes('INSERT INTO Users'));
  assert.ok(inserts.every(({ params }) => params.PhoneNumber === null));
});

test('preserves password whitespace and accepts the bcrypt UTF-8 byte boundary', async (t) => {
  const database = useDatabase(t);
  for (const [index, password] of ['  MatKhau123!  ', 'á'.repeat(36)].entries()) {
    const email = `password${index}@example.com`;
    const { status } = await post({ ...validInput, email, password });
    assert.equal(status, 201);
    const hash = database.users.get(email).PasswordHash;
    assert.equal(await bcrypt.compare(password, hash), true);
    if (password !== password.trim()) assert.equal(await bcrypt.compare(password.trim(), hash), false);
  }
});

test('uses a fresh salt for each registration', async (t) => {
  const database = useDatabase(t);
  await post({ ...validInput, email: 'first@example.com' });
  await post({ ...validInput, email: 'second@example.com' });
  assert.notEqual(database.users.get('first@example.com').PasswordHash,
    database.users.get('second@example.com').PasswordHash);
});

test('returns 409 for an existing email without hashing or inserting', async (t) => {
  const database = useDatabase(t, { existingEmail: true });
  const hash = t.mock.method(bcrypt, 'hash', () => { throw new Error('must not hash'); });
  const { status, body } = await post(validInput);
  assert.equal(status, 409);
  assert.equal(body.errors[0].field, 'email');
  assert.equal(database.calls.length, 1);
  assert.equal(hash.mock.callCount(), 0);
});

test('maps both SQL Server unique violation codes to 409 even after the precheck passes', async (t) => {
  for (const number of [2601, 2627]) {
    for (const nested of [false, true]) {
      const insertError = nested
        ? Object.assign(new Error('SQL internal details'), { originalError: { info: { number } } })
        : Object.assign(new Error('SQL internal details'), { number });
      useDatabase(t, { insertError });
      const { status, body } = await post(validInput);
      assert.equal(status, 409);
      assert.equal(body.errors[0].field, 'email');
      assert.equal(JSON.stringify(body).includes('SQL internal details'), false);
    }
  }
});

test('concurrent registrations for the same normalized email produce one 201 and one 409', async (t) => {
  const database = useDatabase(t);
  const results = await Promise.all([
    post(validInput),
    post({ ...validInput, email: ' AN@EXAMPLE.COM ' }),
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409]);
  assert.equal(database.users.size, 1);
  assert.equal(database.calls.filter(({ query }) => query.includes('SELECT UserId')).length, 2);
});

test('returns a safe 500 response on SQL failure', async (t) => {
  useDatabase(t, { databaseError: new Error('private SQL server credentials and query') });
  t.mock.method(console, 'error', () => {});
  const { status, body } = await post(validInput);
  assert.equal(status, 500);
  assert.equal(body.errors, null);
  assert.equal(JSON.stringify(body).includes('private SQL'), false);
  assert.equal(body.stack, undefined);
});

test('propagates non-duplicate insert errors as 500', async (t) => {
  useDatabase(t, { insertError: Object.assign(new Error('SQL foreign key failure'), { number: 547 }) });
  t.mock.method(console, 'error', () => {});
  const { status, body } = await post(validInput);
  assert.equal(status, 500);
  assert.equal(JSON.stringify(body).includes('foreign key'), false);
});

test('refuses registration if the Customer role has not been seeded', async (t) => {
  const database = useDatabase(t, { missingRole: true });
  t.mock.method(console, 'error', () => {});
  const { status } = await post(validInput);
  assert.equal(status, 500);
  assert.equal(database.calls.some(({ query }) => query.includes('INSERT INTO Users')), false);
});

test('returns JSON 400 for malformed JSON or a missing request body', async (t) => {
  const getPool = t.mock.method(db, 'getPool', () => { throw new Error('must not query'); });
  for (const payload of ['{"password":"secret",', '', 'null']) {
    const { status, body } = await post(payload, true);
    assert.equal(status, 400);
    assert.equal(JSON.stringify(body).includes('secret'), false);
  }
  assert.equal(getPool.mock.callCount(), 0);
});

test('oversized JSON returns a standard 413 error without querying SQL', async (t) => {
  const getPool = t.mock.method(db, 'getPool', () => { throw new Error('must not query'); });
  const { status } = await post({ ...validInput, fullName: 'a'.repeat(110 * 1024) });
  assert.equal(status, 413);
  assert.equal(getPool.mock.callCount(), 0);
});
