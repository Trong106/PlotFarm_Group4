const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(status = 'GROWING') {
  const events = [];
  const writes = [];
  class Transaction {
    async begin() { events.push('begin'); }
    async commit() { events.push('commit'); }
    async rollback() { events.push('rollback'); }
    request() {
      const params = {};
      return { input(key, type, value) { params[key] = value; return this; }, async query(query) {
        if (query.includes('SELECT c.CultivationId')) return { recordset: [{ Status: status }] };
        assert.match(query, /@Priority/);
        writes.push(params);
        return { recordset: [{ RequestId: 1, Priority: params.Priority }] };
      } };
    }
  }
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/cultivationService.js'), 'utf8'), {
    module: mod, require: () => ({ getPool: () => { events.push('pool'); return {}; }, sql: { Transaction, Int: 1, NVarChar: () => 1 } }),
  });
  return { events, writes, run: options => mod.exports.createCareRequest(1, { cultivationId: 7, serviceType: 'Tưới nước', ...options }) };
}
for (const priority of ['NORMAL', 'ATTENTION', 'URGENT']) {
  test(`persists explicit ${priority} independently of note`, async () => {
    const h = setup();
    assert.equal((await h.run({ priority, customerNote: '[KHẨN CẤP] old text' })).Priority, priority);
    assert.equal(h.writes[0].Priority, priority);
    assert.equal(h.events.at(-1), 'commit');
  });
}
test('unknown priorities are rejected before SQL', async () => {
  for (const priority of [null, '', 'HIGH', [], 1]) {
    const h = setup();
    await assert.rejects(h.run({ priority }), e => e.statusCode === 400);
    assert.equal(h.events.length, 0);
  }
});
test('older clients default normally and retain structured legacy urgency', async () => {
  assert.equal((await setup().run({})).Priority, 'NORMAL');
  assert.equal((await setup().run({ customerNote: '🔴 [KHẨN CẤP] cây héo' })).Priority, 'URGENT');
});
test('urgent request does not bypass harvested lifecycle lock', async () => {
  const h = setup('HARVESTED');
  await assert.rejects(h.run({ priority: 'URGENT' }), e => e.statusCode === 409);
  assert.equal(h.writes.length, 0);
  assert.equal(h.events.at(-1), 'rollback');
});
