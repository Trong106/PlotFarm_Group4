const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/plot-status.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject });
const { getPlotStatus } = exportsObject;

test('known plot states have distinct customer labels and requested color groups', () => {
  for (const [Status, tone, label] of [
    ['AVAILABLE', 'available', 'Sẵn sàng thuê'],
    ['RENTED', 'rented', 'Đã thuê'],
    ['RESERVED', 'active', 'Đang giữ chỗ'],
    ['FALLOWING', 'resting', 'Đất nghỉ'],
    ['MAINTENANCE', 'resting', 'Đang bảo trì'],
  ]) {
    const result = getPlotStatus({ Status });
    assert.equal(result.tone, tone);
    assert.equal(result.label, label);
  }
});

test('active cultivation displays amber without changing the rental status', () => {
  for (const HasActiveCultivation of [true, 1]) {
    const plot = { Status: 'RENTED', HasActiveCultivation };
    assert.equal(getPlotStatus(plot).tone, 'active');
    assert.equal(getPlotStatus(plot).label, 'Đang canh tác');
    assert.equal(plot.Status, 'RENTED');
  }
  for (const HasActiveCultivation of [undefined, false, 0, 'false', '0']) {
    assert.equal(getPlotStatus({ Status: 'RENTED', HasActiveCultivation }).tone, 'rented');
  }
});

test('maintenance and rest take priority over stale cultivation records', () => {
  for (const Status of ['MAINTENANCE', 'FALLOWING']) {
    assert.equal(getPlotStatus({ Status, HasActiveCultivation: true }).tone, 'resting');
  }
  assert.equal(getPlotStatus({ Status: 'AVAILABLE', HasActiveCultivation: true }).tone, 'available');
});

test('unknown states are neutral instead of falsely indicating availability or maintenance', () => {
  const result = getPlotStatus({ Status: 'NEW_STATUS', HasActiveCultivation: true });
  assert.equal(result.tone, 'unknown');
  assert.equal(result.label, 'Chưa rõ trạng thái');
});
