// Real SQL Server smoke test. Run the schema scripts first. Only generated fixture users are removed.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const db = require('../src/config/db');
const app = require('../src/app');
const service = require('../src/services/userService');
const { generateToken } = require('../src/utils/jwtHelper');

const main = async () => {
  let server;
  const userIds = [];
  const pool = await db.connectDB();
  if (!pool) throw new Error('SQL Server is unavailable');
  try {
    for (let i = 0; i < 2; i += 1) {
      const result = await pool.request().input('Email', db.sql.NVarChar(150), `profile-test-${randomUUID()}@example.com`)
        .query(`INSERT INTO Users (RoleId, FullName, Email, PasswordHash, Status)
          OUTPUT INSERTED.UserId
          SELECT RoleId, N'Profile API Test', @Email, N'not-a-login-password', 'ACTIVE'
          FROM Roles WHERE RoleName = 'Customer'`);
      assert.equal(result.recordset.length, 1, 'Customer role must be seeded');
      userIds.push(result.recordset[0].UserId);
    }
    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}/api/users/me`;
    const call = async (method, path, payload, owner = userIds[0]) => {
      const response = await fetch(`${base}${path}`, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${generateToken({ userId: owner, role: 'Customer' })}` },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      const json = await response.json();
      assert.equal(json.statusCode, response.status);
      return json;
    };
    assert.equal((await call('GET', '')).data.userId, userIds[0]);
    const updated = await call('PATCH', '', { fullName: 'Người dùng thử nghiệm', phoneNumber: '0901234567', avatarUrl: null });
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.data.fullName, 'Người dùng thử nghiệm');
    assert.ok(updated.data.updatedAt);
    assert.equal((await call('GET', '')).data.fullName, updated.data.fullName);
    assert.deepEqual((await call('GET', '/addresses')).data, []);
    const address = { recipientName: 'Người nhận thử', phoneNumber: '0901234567', addressLine: '12 Nguyễn Huệ',
      ward: 'Bến Nghé', province: 'TP. Hồ Chí Minh', isDefault: true };
    const first = await call('POST', '/addresses', address);
    assert.equal(first.statusCode, 201);
    const second = await call('POST', '/addresses', { ...address, isDefault: false });
    assert.equal(second.statusCode, 201);
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      assert.equal((await call(method, `/addresses/${first.data.addressId}`,
        method === 'PATCH' ? { isDefault: true } : undefined, userIds[1])).statusCode, 404);
    }
    const concurrent = await Promise.all([first, second].map(({ data }) =>
      call('PATCH', `/addresses/${data.addressId}`, { isDefault: true })));
    assert.ok(concurrent.every((result) => result.statusCode === 200));
    const list = await call('GET', '/addresses');
    assert.equal(list.data.length, 2);
    assert.equal(list.data.filter((item) => item.isDefault).length, 1);
    assert.equal(list.data[0].isDefault, true);
    // Force an insert failure after clearing the default to verify real SQL rollback.
    await assert.rejects(() => service.createAddress(userIds[0], { ...address, ward: null }));
    assert.equal((await call('GET', '/addresses')).data.find((item) => item.isDefault).addressId, list.data[0].addressId);
    const cleared = await call('PATCH', `/addresses/${first.data.addressId}`, { district: null, isDefault: false });
    assert.equal(cleared.statusCode, 200);
    assert.equal(cleared.data.district, null);
    for (const { data } of [first, second]) {
      assert.equal((await call('DELETE', `/addresses/${data.addressId}`)).statusCode, 200);
      assert.equal((await call('GET', `/addresses/${data.addressId}`)).statusCode, 404);
    }
    assert.deepEqual((await call('GET', '/addresses')).data, []);
    console.log('SQL smoke test passed: profile persistence, address CRUD, ownership, concurrent defaults and rollback.');
  } finally {
    try {
      if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      for (const userId of userIds) {
        await pool.request().input('UserId', db.sql.Int, userId)
          .query('DELETE FROM UserAddresses WHERE UserId = @UserId; DELETE FROM Users WHERE UserId = @UserId;');
      }
    } finally { await db.closeDB(); }
  }
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
