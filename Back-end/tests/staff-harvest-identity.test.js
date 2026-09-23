const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness({ found = true, status = 'READY_TO_HARVEST', allowed = true, duplicate = false } = {}) {
  const queries = [];
  const events = [];
  const row = { HarvestRequestId: 7, CultivationId: 99, PlotId: 1, CultivationStatus: status, HarvestStatus: 'REQUESTED' };
  const request = () => ({
    params: {}, input(name, type, value) { this.params[name] = value; return this; },
    async query(query) {
      queries.push({ query, params: this.params });
      if (query.includes('FROM StaffAssignments')) return { recordset: allowed ? [{}] : [] };
      if (query.includes('FROM HarvestRequests hr')) return { recordset: found ? [row] : [] };
      if (query.includes('FROM Cultivations c')) return { recordset: [{ ...row, HarvestRequestId: null, CultivationId: this.params.CultivationId }] };
      if (query.includes('SELECT Status FROM Cultivations')) return { recordset: [{ Status: status }] };
      if (query.includes('SELECT HarvestRequestId FROM HarvestRequests')) return { recordset: duplicate ? [{ HarvestRequestId: 7 }] : [] };
      throw Error('Unexpected write: ' + query);
    },
  });
  class Transaction {
    async begin() { events.push('begin'); }
    async rollback() { events.push('rollback'); }
    request() { return request(); }
  }
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/staffService.js'), 'utf8'), {
    module: mod, require: id => id === '../config/db' ? { getPool: () => ({ request }), sql: { Int: 1, Transaction } } : {},
  });
  return { run: (options = {}) => mod.exports.recordHarvestResult(2, 7, { actualYieldKg: 10, ...options }), queries, events };
}

test('unknown harvest request cannot fall back to an unrelated cultivation with same ID', async () => {
  const h = harness({ found: false });
  await assert.rejects(h.run(), error => error.statusCode === 404);
  assert.equal(h.queries.length, 1);
});
test('direct harvest uses explicit cultivation ID even when request ID exists', async () => {
  const h = harness({ allowed: false });
  await assert.rejects(h.run({ cultivationId: 7 }), error => error.statusCode === 403);
  assert.ok(h.queries.every(q => !q.query.includes('FROM HarvestRequests hr')));
  assert.equal(h.queries[0].params.CultivationId, 7);
});
for (const status of ['PLANTING', 'GROWING', 'HARVESTED', 'FAILED']) {
  test(`reject ${status} before changing harvest records`, async () => {
    const h = harness({ status });
    await assert.rejects(h.run(), error => error.statusCode === 409);
    assert.equal(h.events.length, 0);
  });
}
test('direct harvest with existing request rolls back instead of creating duplicate', async () => {
  const h = harness({ duplicate: true });
  await assert.rejects(h.run({ cultivationId: 7 }), error => error.statusCode === 409);
  assert.deepEqual(h.events, ['begin', 'rollback']);
  assert.ok(h.queries.some(q => q.query.includes('UPDLOCK, HOLDLOCK')));
});
