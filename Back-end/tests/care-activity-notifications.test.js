const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ failNotification = false, duplicate = false } = {}) {
  const events = [];
  function request(transactional) {
    const params = {};
    return { input(key, type, value) { params[key] = value; return this; }, async query(q) {
      if (q.includes('INSERT INTO Notifications')) {
        assert.equal(transactional, true);
        assert.match(q, /ro.UserId/);
        assert.match(q, /ro.OrderId = c.OrderId/);
        assert.equal(params.CultivationId, 7);
        events.push('notify');
        if (failNotification) throw Error('notification failure');
        return { recordset: [] };
      }
      if (q.includes('INSERT INTO CultivationLogs')) {
        assert.equal(transactional, true);
        events.push('log');
        return { recordset: [{ LogId: 12 }] };
      }
      if (q.includes('UPDATE CareSchedules')) {
        assert.equal(transactional, true);
        assert.match(q, /AND Status = 'PENDING'/);
        events.push('schedule');
        return { recordset: duplicate ? [] : [{ CareScheduleId: 3 }] };
      }
      if (q.includes('FROM CareSchedules')) return { recordset: [{ CultivationId: 7, PlotId: 1, PlotCode: 'A1', ActivityType: 'WATERING', Status: 'PENDING' }] };
      if (q.includes('FROM Cultivations')) return { recordset: [{ CultivationId: 7 }] };
      throw Error('Unexpected query');
    } };
  }
  class Transaction {
    async begin() { events.push('begin'); }
    async commit() { events.push('commit'); }
    async rollback() { events.push('rollback'); }
    request() { return request(true); }
  }
  const db = { getPool: () => ({ request: () => request(false) }), sql: { Transaction, Int: 1, NVarChar: () => 1 } };
  function load(name) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services', name + '.js'), 'utf8'), {
      module, require: dep => dep === '../config/db' ? db : dep === './careActivityNotification' ? load('careActivityNotification') : {},
    });
    return module.exports;
  }
  return { events,
    log: () => load('cultivationService').createCultivationLog({ cultivationId: 7, staffId: 2, activityType: 'WATERING', title: 'Watered' }),
    schedule: () => load('staffService').completeSchedule(2, 3, { resultNote: 'Done' }, 'Admin'),
  };
}
for (const action of ['log', 'schedule']) {
  test(`${action} saves journal and owner notification together`, async () => {
    const h = setup(); await h[action]();
    assert.deepEqual(h.events, action === 'log' ? ['begin', 'log', 'notify', 'commit'] : ['begin', 'schedule', 'log', 'notify', 'commit']);
  });
  test(`${action} rolls back if notification cannot be saved`, async () => {
    const h = setup({ failNotification: true });
    await assert.rejects(h[action](), /notification failure/);
    assert.equal(h.events.at(-1), 'rollback');
    assert.ok(!h.events.includes('commit'));
  });
}
test('concurrent duplicate completion cannot create extra journal or notification', async () => {
  const h = setup({ duplicate: true });
  await assert.rejects(h.schedule(), e => e.statusCode === 409);
  assert.deepEqual(h.events, ['begin', 'schedule', 'rollback']);
});
