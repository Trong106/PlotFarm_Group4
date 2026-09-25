const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/weekly-care.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exported = {};
vm.runInNewContext(source, { exports: exported });
const { weeklyCare } = exported;
const log = (LogId, LogDate, ActivityType = 'WATERING', extra = {}) => ({ LogId, LogDate, ActivityType, CultivationId: 7, ...extra });
const now = new Date('2026-09-24T04:00:00Z');

test('weekly care excludes previous week, future dates and other plots', () => {
  const result = weeklyCare([
    log(1, '2026-09-20'), log(2, '2026-09-21T00:00:00.000Z'),
    log(3, '2026-09-24', 'FERTILIZING'), log(4, '2026-09-27'),
    log(5, '2026-09-23', 'WATERING', { CultivationId: 8 }),
  ], 7, now);
  assert.equal(result.watering, 1);
  assert.equal(result.fertilizing, 1);
  assert.deepEqual(Array.from(result.items, x => x.log.LogId), [3, 2]);
  assert.equal(result.startLabel, '21/09');
  assert.equal(result.endLabel, '27/09');
});
test('week switches at Vietnam midnight, not browser or UTC midnight', () => {
  const logs = [log(1, '2026-09-20'), log(2, '2026-09-21')];
  assert.deepEqual(Array.from(weeklyCare(logs, 7, new Date('2026-09-20T16:59:59Z')).items, x => x.log.LogId), [1]);
  assert.deepEqual(Array.from(weeklyCare(logs, 7, new Date('2026-09-20T17:00:00Z')).items, x => x.log.LogId), [2]);
});
test('recognizes Vietnamese completed care titles without treating emergency notes as completed care', () => {
  const result = weeklyCare([
    log(1, '2026-09-22', 'CARE_ACTIVITY', { Title: '[Chăm sóc] Hoàn thành: Tưới nước và bón phân vi sinh' }),
    log(2, '2026-09-23', 'EMERGENCY_ALERT', { Title: 'Cần tưới nước', Notes: 'Chưa bón phân' }),
    log(3, '2026-09-23', 'TƯỚI NƯỚC'), log(3, '2026-09-23', 'TƯỚI NƯỚC'),
  ], 7, now);
  assert.equal(result.watering, 2);
  assert.equal(result.fertilizing, 1);
});
test('empty or invalid journal data does not fabricate activities', () => {
  const result = weeklyCare([log(1, 'invalid'), log(2, '2026-09-22', 'HARVEST')], 7, now);
  assert.equal(result.items.length, 0);
  assert.equal(result.watering + result.fertilizing, 0);
});
