const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/care-packages.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helper = {};
vm.runInNewContext(compiled, { exports: helper });
const { getPackageTier, parsePackageServices, PACKAGE_TIERS } = helper;
const services = (value) => Array.from(parsePackageServices(value).services);

test('Vietnamese, unaccented and English tier names share the promised response time', () => {
  for (const [name, hours] of [
    ['Gói Cơ bản (Basic)', 24], ['CO BAN', 24], ['Basic', 24],
    ['Gói Nâng cao', 8], ['Nang cao (Advanced)', 8], ['Gói VIP', 2],
  ]) assert.equal(PACKAGE_TIERS[getPackageTier(name)].responseHours, hours);
});

test('unknown, missing, ambiguous and partial names never inherit a response promise', () => {
  for (const name of [null, undefined, 1, '', 'Gói gia đình', 'Premium', 'VIPER', 'VIP / Cơ bản']) {
    assert.equal(getPackageTier(name), null);
  }
});

test('JSON arrays preserve punctuation inside one entitlement and remove duplicate entries', () => {
  assert.deepEqual(services('["Tưới nước, kiểm tra độ ẩm", " Camera 24/7 ", "camera 24/7"]'), [
    'Tưới nước, kiểm tra độ ẩm', 'camera 24/7',
  ]);
});

test('plain lists preserve descriptions with commas and parentheses', () => {
  assert.deepEqual(services('Tưới nước (sáng, chiều), Chụp ảnh'), ['Tưới nước (sáng, chiều)', 'Chụp ảnh']);
  assert.deepEqual(services('• Tưới nước, kiểm tra độ ẩm\n• Chụp ảnh; Tư vấn'), [
    'Tưới nước, kiểm tra độ ẩm', 'Chụp ảnh', 'Tư vấn',
  ]);
});

test('missing or malformed data remains unknown rather than excluded or a made-up benefit', () => {
  for (const value of [null, undefined, 10, '', ' ', 'null', '{"camera":true}', '["Tưới nước",', { camera: true }]) {
    assert.equal(parsePackageServices(value).available, false);
    assert.deepEqual(services(value), []);
  }
  assert.equal(parsePackageServices('[]').available, true);
  assert.deepEqual(services('[]'), []);
});

test('partially invalid arrays expose only supplied text and keep absent entitlements unknown', () => {
  const result = parsePackageServices('["Tưới nước", null, {"name":"Camera"}]');
  assert.equal(result.available, false);
  assert.deepEqual(Array.from(result.services), ['Tưới nước']);
});
