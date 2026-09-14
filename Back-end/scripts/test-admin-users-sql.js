// Run against a development database after database/schema.sql.
// All writes are restricted to generated fixture users, removed in finally.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const db = require('../src/config/db');
const app = require('../src/app');
const { generateToken } = require('../src/utils/jwtHelper');

const main = async () => {
  const pool = await db.connectDB();
  if (!pool) throw new Error('SQL Server is unavailable');
  const marker = `admin-list-${randomUUID()}`;
  const users = [];
  let server;
  try {
    const fixtures = [
      { role: 'Admin', status: 'ACTIVE' }, { role: 'Staff', status: 'ACTIVE' },
      { role: 'Customer', status: 'LOCKED' }, { role: 'Customer', status: 'PENDING' },
    ];
    for (const [index, fixture] of fixtures.entries()) {
      const name = `${marker} Nguyễn ${index === 2 ? '%_[~' : index}`;
      const email = `${marker}-${index}@example.com`;
      const phone = `${Date.now()}${index}0`;
      const result = await pool.request()
        .input('Role', db.sql.NVarChar(50), fixture.role)
        .input('Status', db.sql.NVarChar(30), fixture.status)
        .input('Name', db.sql.NVarChar(100), name)
        .input('Email', db.sql.NVarChar(150), email)
        .input('Phone', db.sql.NVarChar(20), phone)
        .query(`INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status, CreatedAt)
          OUTPUT INSERTED.UserId
          SELECT RoleId, @Name, @Email, N'not-a-login-password', @Phone, @Status, '2026-09-14T00:00:00'
          FROM Roles WHERE RoleName = @Role`);
      assert.equal(result.recordset.length, 1, `Missing seeded ${fixture.role} role`);
      users.push({ userId: result.recordset[0].UserId, ...fixture, name, email, phone });
    }
    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const token = generateToken({ userId: users[0].userId, role: 'Admin' });
    const get = async (query, authToken = token) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users?${new URLSearchParams(query)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await response.json();
      assert.equal(json.statusCode, response.status);
      return json;
    };
    const all = await get({ search: marker });
    assert.equal(all.statusCode, 200);
    assert.equal(all.data.pagination.total, 4);
    const expectedIds = users.map((user) => user.userId).reverse();
    assert.deepEqual(all.data.users.map((user) => user.userId), expectedIds);
    assert.doesNotMatch(JSON.stringify(all), /PasswordHash|not-a-login-password/i);
    const first = await get({ search: marker, page: 1, limit: 2 });
    const second = await get({ search: marker, page: 2, limit: 2 });
    assert.deepEqual([...first.data.users, ...second.data.users].map((user) => user.userId), expectedIds);
    assert.deepEqual(second.data.pagination, { page: 2, limit: 2, total: 4, totalPages: 2, hasNextPage: false, hasPreviousPage: true });
    const beyond = await get({ search: marker, page: 3, limit: 2 });
    assert.deepEqual(beyond.data.users, []);
    assert.equal(beyond.data.pagination.total, 4);
    const empty = await get({ search: `${marker}-absent` });
    assert.equal(empty.data.pagination.total, 0);
    assert.equal(empty.data.pagination.totalPages, 0);
    for (const search of [users[2].name, users[2].email.toUpperCase(), users[2].phone]) {
      const found = await get({ search: ` ${search} ` });
      assert.equal(found.statusCode, 200);
      assert.deepEqual(found.data.users.map((user) => user.userId), [users[2].userId]);
    }
    const injection = await get({ search: `${marker}' OR 1=1--` });
    assert.equal(injection.statusCode, 200);
    assert.equal(injection.data.pagination.total, 0);
    assert.equal((await get({ limit: 101 })).statusCode, 400);
    const staffToken = generateToken({ userId: users[1].userId, role: 'Staff' });
    assert.equal((await get({ search: marker }, staffToken)).statusCode, 403);
    await pool.request().input('UserId', db.sql.Int, users[0].userId)
      .query("UPDATE Users SET Status = 'LOCKED' WHERE UserId = @UserId");
    assert.equal((await get({ search: marker })).statusCode, 403);
    await pool.request().input('UserId', db.sql.Int, users[0].userId)
      .query("UPDATE Users SET Status = 'ACTIVE', RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer') WHERE UserId = @UserId");
    assert.equal((await get({ search: marker })).statusCode, 403);
    console.log('SQL smoke test passed: Admin authorization, live role/status checks, name/email/phone search, literal wildcards, pagination and secret exclusion.');
  } finally {
    try {
      if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      for (const user of users) {
        await pool.request().input('UserId', db.sql.Int, user.userId).input('Email', db.sql.NVarChar(150), user.email)
          .query('DELETE FROM Users WHERE UserId = @UserId AND Email = @Email');
      }
    } finally { await db.closeDB(); }
  }
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
