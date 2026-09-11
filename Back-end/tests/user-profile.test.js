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
  baseUrl = `http://127.0.0.1:${server.address().port}/api/users/me`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const profile = { UserId: 10, FullName: 'Nguyễn Văn An', Email: 'an@example.com', PhoneNumber: null,
  AvatarUrl: null, RoleId: 3, Status: 'ACTIVE', CreatedAt: '2026-09-11T00:00:00.000Z', UpdatedAt: null };
const address = { AddressId: 7, UserId: 10, RecipientName: 'Nguyễn Văn An', PhoneNumber: '0901234567',
  AddressLine: '12 Nguyễn Huệ', Ward: 'Bến Nghé', District: null, Province: 'TP. Hồ Chí Minh',
  IsDefault: false, CreatedAt: '2026-09-11T00:00:00.000Z', UpdatedAt: null };
const addressBody = { recipientName: address.RecipientName, phoneNumber: address.PhoneNumber,
  addressLine: address.AddressLine, ward: address.Ward, province: address.Province };

const request = async (method, path = '', body, options = {}) => {
  const token = options.token ?? generateToken({ userId: 10, role: 'Customer' });
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(options.noAuth ? {} : { Authorization: `Bearer ${token}` }) },
    ...(body !== undefined ? { body: options.raw ? body : JSON.stringify(body) } : {}),
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  const json = await response.json();
  assert.equal(json.statusCode, response.status);
  assert.equal(json.success, response.ok);
  assert.ok(Number.isFinite(Date.parse(json.timestamp)));
  return { status: response.status, ...json };
};

// Scripted SQL boundary: unexpected SQL fails the test instead of silently succeeding.
const useDatabase = (t, steps = []) => {
  const calls = [];
  const lifecycle = [];
  const queryRequest = (transactional = false) => {
    const params = {};
    return {
      input(name, type, value) { params[name] = value; return this; },
      async query(query) {
        calls.push({ query, params, transactional });
        const step = steps.shift();
        assert.ok(step, `Unexpected query: ${query}`);
        assert.match(query, step.match);
        if (step.check) step.check({ query, params, transactional });
        if (step.error) throw step.error;
        return { recordset: step.rows ?? [] };
      },
    };
  };
  t.mock.method(db, 'getPool', () => ({
    request: () => queryRequest(),
    transaction: () => ({
      begin: async () => { lifecycle.push('begin'); },
      commit: async () => { lifecycle.push('commit'); },
      rollback: async () => { lifecycle.push('rollback'); },
      request: () => queryRequest(true),
    }),
  }));
  t.after(() => assert.equal(steps.length, 0, 'Expected SQL was not executed'));
  return { calls, lifecycle };
};
const readProfile = (rows = [profile]) => ({ match: /SELECT .* FROM Users WHERE UserId = @UserId/, rows });
const lockOwner = { match: /FROM Users WITH \(UPDLOCK, HOLDLOCK\)/, rows: [{ UserId: 10, Status: 'ACTIVE' }] };
const ownedAddress = (rows = [address]) => ({ match: /FROM UserAddresses\s+WHERE UserId = @UserId AND AddressId = @AddressId/, rows });

test('all user endpoints require authentication before database access', async (t) => {
  const database = useDatabase(t);
  for (const [method, path, body] of [
    ['GET', ''], ['PATCH', '', { fullName: 'An' }], ['GET', '/addresses'],
    ['POST', '/addresses', addressBody], ['GET', '/addresses/7'],
    ['PATCH', '/addresses/7', { isDefault: true }], ['DELETE', '/addresses/7'],
  ]) assert.equal((await request(method, path, body, { noAuth: true })).status, 401);
  assert.equal((await request('GET', '', undefined, { token: 'forged-token' })).status, 401);
  assert.equal((await request('GET', '', undefined, { token: generateToken({ userId: -1, role: 'Customer' }) })).status, 401);
  assert.equal(database.calls.length, 0);
});

test('GET profile reads current database fields without secrets', async (t) => {
  const database = useDatabase(t, [readProfile()]);
  const result = await request('GET');
  assert.equal(result.status, 200);
  assert.equal(result.data.fullName, profile.FullName);
  assert.equal(result.data.email, profile.Email);
  assert.equal(result.data.avatarUrl, null);
  assert.equal(database.calls[0].params.UserId, 10);
  assert.doesNotMatch(database.calls[0].query, /Password|SELECT \*/i);
  assert.equal(result.data.passwordHash, undefined);
});

test('PATCH profile normalizes values, clears nullable fields and parameterizes input', async (t) => {
  useDatabase(t, [readProfile(), {
    match: /UPDATE Users/,
    check: ({ query, params }) => {
      assert.equal(params.UserId, 10);
      assert.equal(params.FullName, "An ' ; DROP TABLE Users; --");
      assert.equal(params.Email, 'new@example.com');
      assert.equal(params.PhoneNumber, null);
      assert.equal(params.AvatarUrl, null);
      assert.ok(!query.includes('DROP TABLE'));
      assert.match(query, /UpdatedAt = SYSDATETIME\(\)/);
    }, rows: [{ ...profile, Email: 'new@example.com' }],
  }]);
  const result = await request('PATCH', '', { fullName: "  An ' ; DROP TABLE Users; --  ",
    email: ' NEW@EXAMPLE.COM ', phoneNumber: ' ', avatarUrl: null });
  assert.equal(result.status, 200);
  assert.equal(result.data.email, 'new@example.com');
});

test('partial profile update only writes supplied fields', async (t) => {
  useDatabase(t, [readProfile(), { match: /UPDATE Users/, rows: [profile], check: ({ params, query }) => {
    assert.deepEqual(params, { UserId: 10, FullName: 'An' });
    assert.doesNotMatch(query.split('OUTPUT')[0], /Email =|PhoneNumber =|AvatarUrl =/);
  } }]);
  assert.equal((await request('PATCH', '', { fullName: 'An' })).status, 200);
});

test('profile validation rejects empty, privileged, malformed and oversized fields', async (t) => {
  const database = useDatabase(t);
  for (const body of [{}, [], { fullName: ' ' }, { fullName: 'a'.repeat(101) }, { fullName: null },
    { email: 'bad' }, { phoneNumber: '123' }, { phoneNumber: 901234567 }, { avatarUrl: 'javascript:alert(1)' },
    { avatarUrl: '/relative.png' }, { avatarUrl: `https://example.com/${'a'.repeat(500)}` },
    { userId: 11 }, { fullName: 'An', roleId: 1 }, { status: 'ACTIVE' }, { passwordHash: 'secret' }]) {
    const result = await request('PATCH', '', body);
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.ok(Array.isArray(result.errors));
  }
  assert.equal((await request('PATCH', '', '{"fullName":', { raw: true })).status, 400);
  assert.equal(database.calls.length, 0);
});

test('duplicate emails return 409 for both SQL unique violation codes', async (t) => {
  for (const error of [Object.assign(new Error('SQL duplicate'), { number: 2601 }),
    Object.assign(new Error('SQL duplicate'), { originalError: { info: { number: 2627 } } })]) {
    useDatabase(t, [readProfile(), { match: /UPDATE Users/, error }]);
    const result = await request('PATCH', '', { email: 'duplicate@example.com' });
    assert.equal(result.status, 409);
    assert.equal(result.errors[0].field, 'email');
  }
});

test('missing and inactive users cannot access profiles or addresses', async (t) => {
  useDatabase(t, [readProfile([])]);
  assert.equal((await request('GET')).status, 404);
  for (const status of ['LOCKED', 'PENDING']) {
    useDatabase(t, [readProfile([{ ...profile, Status: status }])]);
    assert.equal((await request('POST', '/addresses', addressBody)).status, 403);
  }
});

test('lists only owner addresses, with default first, and supports empty lists', async (t) => {
  for (const rows of [[], [address]]) {
    useDatabase(t, [readProfile(), { match: /WHERE UserId = @UserId ORDER BY IsDefault DESC, AddressId DESC/,
      rows, check: ({ params }) => assert.deepEqual(params, { UserId: 10 }) }]);
    const result = await request('GET', '/addresses');
    assert.equal(result.status, 200);
    assert.equal(result.data.length, rows.length);
  }
});

test('GET address checks owner and returns a boolean default flag', async (t) => {
  const database = useDatabase(t, [readProfile(), ownedAddress([{ ...address, IsDefault: 1 }])]);
  const result = await request('GET', '/addresses/7');
  assert.equal(result.status, 200);
  assert.equal(result.data.isDefault, true);
  assert.deepEqual(database.calls[1].params, { UserId: 10, AddressId: 7 });
});

test('address creation defaults optional fields and returns 201', async (t) => {
  const database = useDatabase(t, [readProfile(), lockOwner, { match: /INSERT INTO UserAddresses/,
    rows: [address], check: ({ params, transactional }) => {
      assert.equal(transactional, true);
      assert.equal(params.UserId, 10);
      assert.equal(params.District, null);
      assert.equal(params.IsDefault, false);
      assert.equal(params.RecipientName, address.RecipientName);
    } }]);
  const result = await request('POST', '/addresses', { ...addressBody, recipientName: ` ${address.RecipientName} ` });
  assert.equal(result.status, 201);
  assert.equal(result.data.addressId, 7);
  assert.deepEqual(database.lifecycle, ['begin', 'commit']);
});

test('create and update default address clear previous default within the same transaction', async (t) => {
  for (const method of ['POST', 'PATCH']) {
    const database = useDatabase(t, [readProfile(), lockOwner,
      ...(method === 'PATCH' ? [ownedAddress()] : []),
      { match: /SET IsDefault = 0.*UpdatedAt = SYSDATETIME\(\)/, check: ({ params, query }) => {
        assert.equal(params.UserId, 10);
        assert.match(query, /WHERE UserId = @UserId AND IsDefault = 1/);
      } },
      { match: method === 'POST' ? /INSERT INTO UserAddresses/ : /UPDATE UserAddresses SET IsDefault = @IsDefault/,
        rows: [{ ...address, IsDefault: true }] },
    ]);
    const result = await request(method, method === 'POST' ? '/addresses' : '/addresses/7',
      method === 'POST' ? { ...addressBody, isDefault: true } : { isDefault: true });
    assert.equal(result.status, method === 'POST' ? 201 : 200);
    assert.equal(result.data.isDefault, true);
    assert.ok(database.calls.slice(1).every((call) => call.transactional));
    assert.deepEqual(database.lifecycle, ['begin', 'commit']);
  }
});

test('PATCH address preserves omitted fields and supports clearing district and default', async (t) => {
  useDatabase(t, [readProfile(), lockOwner, ownedAddress(), { match: /UPDATE UserAddresses SET/,
    rows: [address], check: ({ params, query }) => {
      assert.deepEqual(params, { UserId: 10, AddressId: 7, District: null, IsDefault: false });
      assert.match(query, /WHERE UserId = @UserId AND AddressId = @AddressId/);
    } }]);
  assert.equal((await request('PATCH', '/addresses/7', { district: null, isDefault: false })).status, 200);
});

test('foreign or nonexistent addresses return 404 without changing default flags', async (t) => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const database = useDatabase(t, [readProfile(), ...(method !== 'GET' ? [lockOwner] : []),
      method === 'DELETE' ? { match: /DELETE FROM UserAddresses.*OUTPUT DELETED.AddressId/, rows: [],
        check: ({ query, params }) => {
          assert.match(query, /WHERE UserId = @UserId AND AddressId = @AddressId/);
          assert.deepEqual(params, { UserId: 10, AddressId: 99 });
        } } : ownedAddress([]),
    ]);
    assert.equal((await request(method, '/addresses/99', method === 'PATCH' ? { isDefault: true } : undefined)).status, 404);
    assert.deepEqual(database.lifecycle, method === 'GET' ? [] : ['begin', 'rollback']);
  }
});

test('DELETE address returns standard JSON and commits', async (t) => {
  const database = useDatabase(t, [readProfile(), lockOwner, { match: /DELETE FROM UserAddresses/, rows: [{ AddressId: 7 }] }]);
  const result = await request('DELETE', '/addresses/7');
  assert.equal(result.status, 200);
  assert.equal(result.data, null);
  assert.deepEqual(database.lifecycle, ['begin', 'commit']);
});

test('referenced address cannot be deleted and returns 409', async (t) => {
  const database = useDatabase(t, [readProfile(), lockOwner, { match: /DELETE FROM UserAddresses/,
    error: Object.assign(new Error('FK delivery conflict'), { number: 547 }) }]);
  assert.equal((await request('DELETE', '/addresses/7')).status, 409);
  assert.deepEqual(database.lifecycle, ['begin', 'rollback']);
});

test('address validation rejects invalid IDs and bodies before accessing database', async (t) => {
  const database = useDatabase(t);
  for (const id of ['0', '-1', '1.5', '1e2', 'abc', '2147483648', '999999999999999999999', '01']) {
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      assert.equal((await request(method, `/addresses/${id}`, method === 'PATCH' ? { isDefault: true } : undefined)).status, 400);
    }
  }
  for (const body of [{}, { ...addressBody, recipientName: ' ' }, { ...addressBody, phoneNumber: null },
    { ...addressBody, phoneNumber: '' }, { ...addressBody, addressLine: 'a'.repeat(256) },
    { ...addressBody, province: null }, { ...addressBody, ward: '' },
    { ...addressBody, isDefault: 'true' }, { ...addressBody, userId: 99 }]) {
    assert.equal((await request('POST', '/addresses', body)).status, 400);
  }
  for (const body of [{}, { userId: 99 }, { recipientName: null }, { isDefault: null }]) {
    assert.equal((await request('PATCH', '/addresses/7', body)).status, 400);
  }
  assert.equal(database.calls.length, 0);
});

test('database failure after clearing default rolls back and hides SQL details', async (t) => {
  t.mock.method(console, 'error', () => {});
  const database = useDatabase(t, [readProfile(), lockOwner, ownedAddress(),
    { match: /SET IsDefault = 0/ }, { match: /UPDATE UserAddresses SET IsDefault = @IsDefault/,
      error: new Error('Sensitive SQL connection information') }]);
  const result = await request('PATCH', '/addresses/7', { isDefault: true });
  assert.equal(result.status, 500);
  assert.equal(result.errors, null);
  assert.ok(!JSON.stringify(result).includes('Sensitive SQL'));
  assert.deepEqual(database.lifecycle, ['begin', 'rollback']);
});

test('database read failure is 500, not a misleading 404', async (t) => {
  t.mock.method(console, 'error', () => {});
  useDatabase(t, [{ match: /FROM Users/, error: new Error('Sensitive database error') }]);
  const result = await request('GET');
  assert.equal(result.status, 500);
  assert.ok(!JSON.stringify(result).includes('Sensitive'));
});

test('Swagger exposes every user endpoint with Bearer security', async () => {
  const spec = await (await fetch(baseUrl.replace('/users/me', '/docs.json'))).json();
  for (const [path, methods] of [['/users/me', ['get', 'patch']],
    ['/users/me/addresses', ['get', 'post']], ['/users/me/addresses/{addressId}', ['get', 'patch', 'delete']]]) {
    for (const method of methods) assert.deepEqual(spec.paths[path][method].security, [{ BearerAuth: [] }]);
  }
});
