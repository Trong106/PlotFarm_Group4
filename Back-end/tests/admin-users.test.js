const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const db = require('../src/config/db');
const app = require('../src/app');
const { generateToken } = require('../src/utils/jwtHelper');

let server;
let baseUrl;
before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/users`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const getUsers = async (query = '', options = {}) => {
  const token = options.token ?? generateToken({ userId: options.userId ?? 10, role: options.role ?? 'Admin' });
  const response = await fetch(`${baseUrl}${query}`, {
    headers: options.noAuth ? {} : { Authorization: `Bearer ${token}` },
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  const result = await response.json();
  assert.equal(result.statusCode, response.status);
  assert.equal(result.success, response.ok);
  assert.ok(Number.isFinite(Date.parse(result.timestamp)));
  return result;
};
const row = { UserId: 23, FullName: 'Nguyễn Văn An', Email: 'an@example.com', PhoneNumber: '0901234567',
  AvatarUrl: null, RoleId: 3, RoleName: 'Customer', Status: 'ACTIVE', CreatedAt: '2026-09-14T00:00:00.000Z', UpdatedAt: null };

const useDatabase = (t, options = {}) => {
  const calls = [];
  const mock = t.mock.method(db, 'getPool', () => ({
    request() {
      const params = {};
      return {
        input(name, type, value) { params[name] = value; return this; },
        async query(query) {
          calls.push({ query, params });
          if (query.includes('WHERE u.UserId = @UserId')) {
            if (options.authError) throw options.authError;
            return { recordset: options.missingAdmin ? [] : [{ Status: options.status ?? 'ACTIVE', RoleName: options.role ?? 'Admin' }] };
          }
          assert.match(query, /SELECT COUNT\(\*\) AS Total/);
          if (options.listError) throw options.listError;
          return { recordsets: [[{ Total: options.total ?? 1 }], options.users ?? [row]] };
        },
      };
    },
  }));
  return { calls, mock };
};

test('admin users rejects missing, forged and expired tokens without database access', async (t) => {
  const database = useDatabase(t);
  for (const options of [{ noAuth: true }, { token: 'forged-token' },
    { token: generateToken({ userId: 10, role: 'Admin' }, '-1s') }]) {
    assert.equal((await getUsers('', options)).statusCode, 401);
  }
  assert.equal(database.mock.mock.callCount(), 0);
});

test('Customer and Staff cannot list users, including by injecting an Admin role', async (t) => {
  const database = useDatabase(t);
  for (const role of ['Customer', 'Staff', 'Unknown']) {
    assert.equal((await getUsers('?role=Admin&userId=1', { role })).statusCode, 403);
  }
  assert.equal(database.mock.mock.callCount(), 0);
});

test('invalid signed user IDs cannot reach SQL', async (t) => {
  const database = useDatabase(t);
  for (const userId of [-1, '10', 1.5, 2147483648]) {
    assert.equal((await getUsers('', { userId })).statusCode, 401);
  }
  assert.equal(database.mock.mock.callCount(), 0);
});

test('locked, pending, removed and demoted Admins cannot use an old Admin JWT', async (t) => {
  for (const options of [{ status: 'LOCKED' }, { status: 'PENDING' }, { missingAdmin: true }, { role: 'Customer' }, { role: 'Staff' }]) {
    const database = useDatabase(t, options);
    assert.equal((await getUsers()).statusCode, 403);
    assert.equal(database.calls.length, 1);
    assert.deepEqual(database.calls[0].params, { UserId: 10 });
    database.mock.mock.restore();
  }
});

test('Admin receives default pagination, camelCase user fields and no secrets', async (t) => {
  const database = useDatabase(t, { users: [{ ...row, PasswordHash: 'sensitive-hash', PasswordResetToken: 'sensitive-token' }] });
  const result = await getUsers();
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.data, {
    users: [{ userId: 23, fullName: row.FullName, email: row.Email, phoneNumber: row.PhoneNumber, avatarUrl: null,
      roleId: 3, role: 'Customer', status: 'ACTIVE', createdAt: row.CreatedAt, updatedAt: null }],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });
  assert.doesNotMatch(JSON.stringify(result), /sensitive|password/i);
  assert.deepEqual(database.calls[1].params, { Search: null, Offset: 0, Limit: 10 });
  assert.doesNotMatch(database.calls[1].query, /Password|SELECT\s+\*/i);
  assert.match(database.calls[1].query, /ORDER BY u.CreatedAt DESC, u.UserId DESC/);
  assert.match(database.calls[1].query, /OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/);
});

test('search is trimmed, parameterized and applied to both count and paginated data', async (t) => {
  const database = useDatabase(t, { total: 23 });
  const result = await getUsers(`?search=${encodeURIComponent('  Nguyễn  ')}&page=2&limit=10`);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.data.pagination, { page: 2, limit: 10, total: 23, totalPages: 3, hasNextPage: true, hasPreviousPage: true });
  assert.deepEqual(database.calls[1].params, { Search: '%Nguyễn%', Offset: 10, Limit: 10 });
  for (const field of ['FullName', 'Email', 'PhoneNumber']) {
    assert.equal(database.calls[1].query.split(`u.${field} LIKE @Search ESCAPE N'~'`).length - 1, 2);
  }
  assert.ok(!database.calls[1].query.includes('Nguyễn'));
});

test('search treats SQL wildcards literally and never interpolates injection text', async (t) => {
  const database = useDatabase(t);
  const search = "%' OR 1=1;--_[~";
  assert.equal((await getUsers(`?search=${encodeURIComponent(search)}`)).statusCode, 200);
  assert.equal(database.calls[1].params.Search, "%~%' OR 1=1;--~_~[~~%");
  assert.ok(!database.calls[1].query.includes('OR 1=1'));
});

test('blank search means no filter', async (t) => {
  const database = useDatabase(t);
  for (const query of ['?search=', '?search=%20%20']) {
    assert.equal((await getUsers(query)).statusCode, 200);
  }
  assert.equal(database.calls[1].params.Search, null);
  assert.equal(database.calls[3].params.Search, null);
});

test('empty results and out-of-range pages return 200 with accurate metadata', async (t) => {
  for (const [total, page, totalPages] of [[0, 1, 0], [21, 4, 3], [20, 3, 2]]) {
    const database = useDatabase(t, { total, users: [] });
    const result = await getUsers(`?page=${page}&limit=10`);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.data.users, []);
    assert.deepEqual(result.data.pagination, { total, page, totalPages, limit: 10, hasNextPage: false, hasPreviousPage: page > 1 });
    database.mock.mock.restore();
  }
});

test('invalid pagination, repeated, nested, unknown and oversized query inputs return 400 before SQL', async (t) => {
  const database = useDatabase(t);
  const invalidQueries = [
    'page=0', 'page=-1', 'page=1.5', 'page=1e2', 'page=0x10', 'page=01', 'page=', 'page=%20', 'page=abc',
    'page=2147483648', 'page=99999999999999999999999', 'page=2147483647&limit=100',
    'limit=0', 'limit=-1', 'limit=101', 'limit=1.5', 'limit=true', 'limit=',
    'page=1&page=2', 'limit=1&limit=2', 'search=a&search=b',
    'page[x]=1', 'limit[]=10', 'search[x]=a', 'search[]=a', `search=${'a'.repeat(151)}`, 'role=Admin', 'offset=0',
  ];
  for (const query of invalidQueries) {
    const result = await getUsers(`?${query}`);
    assert.equal(result.statusCode, 400, query);
    assert.ok(Array.isArray(result.errors));
    assert.ok(result.errors.length > 0);
  }
  assert.equal(database.mock.mock.callCount(), 0);
});

test('maximum valid limit, search length and SQL offset boundaries are accepted', async (t) => {
  const database = useDatabase(t, { total: 0, users: [] });
  assert.equal((await getUsers(`?page=21474837&limit=100&search=${'~'.repeat(150)}`)).statusCode, 200);
  assert.equal(database.calls[1].params.Offset, 2147483600);
  assert.equal(database.calls[1].params.Limit, 100);
  assert.equal(database.calls[1].params.Search.length, 302);
});

test('SQL failures in authorization or listing use the safe standard 500 response', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const errorPoint of ['authError', 'listError']) {
    const database = useDatabase(t, { [errorPoint]: new Error('Sensitive SQL server password or query') });
    const result = await getUsers();
    assert.equal(result.statusCode, 500);
    assert.equal(result.errors, null);
    assert.doesNotMatch(JSON.stringify(result), /Sensitive|stack/);
    database.mock.mock.restore();
  }
});

test('Swagger documents Admin users endpoint, security and pagination parameters', async () => {
  const spec = await (await fetch(baseUrl.replace('/users', '/docs.json'))).json();
  const operation = spec.paths['/users'].get;
  assert.deepEqual(operation.security, [{ BearerAuth: [] }]);
  assert.deepEqual(operation.parameters.map((parameter) => parameter.name), ['search', 'page', 'limit']);
  assert.equal(operation.parameters.find((parameter) => parameter.name === 'limit').schema.maximum, 100);
  for (const code of [200, 400, 401, 403, 500]) assert.ok(operation.responses[code]);
});
