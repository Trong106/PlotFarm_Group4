const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTS(relativePath) {
  const code = fs.readFileSync(path.join(__dirname, '../src', relativePath), 'utf8');
  const compiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  return compiled;
}

test('SeedInfoTooltip component file exists and compiles without errors', () => {
  const compiled = loadTS('components/plots/SeedInfoTooltip.tsx');
  assert.ok(compiled.includes('SeedInfoTooltip'));
  assert.ok(compiled.includes('GrowthDurationDays'));
  assert.ok(compiled.includes('ExpectedYieldKgPerM2'));
  assert.ok(compiled.includes('Season') || compiled.includes('seasonText'));
});

test('Seed data analytics metrics validation', () => {
  const sampleSeed = {
    SeedId: 1,
    SeedName: 'Cải Cúc Hữu Cơ',
    Category: 'Rau Ăn Lá',
    GrowthDurationDays: 35,
    ExpectedYieldKgPerM2: 2.8,
    Season: 'Thu Đông',
    SuitableSoilType: 'Đất phù sa nhẹ',
  };

  assert.equal(typeof sampleSeed.GrowthDurationDays, 'number');
  assert.equal(sampleSeed.GrowthDurationDays > 0, true);
  assert.equal(typeof sampleSeed.ExpectedYieldKgPerM2, 'number');
  assert.equal(sampleSeed.ExpectedYieldKgPerM2 > 0, true);
  assert.equal(typeof sampleSeed.Season, 'string');
  assert.ok(sampleSeed.Season.length > 0);
});
