const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, URLSearchParams, AbortSignal, ...globals });
  return exports;
}
const catalog = load('lib/seed-catalog.ts');
const weather = load('lib/farm-weather.ts');
const seeds = [29, 30, 60, 61, null, 0].map((days, i) => ({
  SeedName: i === 0 ? 'Đậu Đũa' : 'Cải xanh', GrowthDurationDays: days, Category: i < 2 ? 'A' : 'B',
}));

test('seed search ignores accents, case, and surrounding spaces', () => {
  const result = catalog.filterSeeds(seeds, { query: ' DAU DUA ', growth: 'ALL' });
  assert.equal(result.length, 1);
  assert.equal(result[0], seeds[0]);
});
test('growth filter uses exact 30/60 boundaries and excludes unknown durations', () => {
  for (const [growth, days] of [['SHORT', [29]], ['MEDIUM', [30, 60]], ['LONG', [61]]]) {
    assert.deepEqual(Array.from(catalog.filterSeeds(seeds, { query: '', growth }), s => s.GrowthDurationDays), days);
  }
  assert.equal(catalog.filterSeeds(seeds, { query: '', growth: 'ALL' }).length, 6);
});
test('name, category and growth combine without modifying original seeds', () => {
  assert.equal(catalog.filterSeeds(seeds, { query: 'cai', growth: 'MEDIUM', category: 'A' })[0], seeds[1]);
  assert.equal(catalog.filterSeeds(seeds, { query: 'tomato', growth: 'ALL' }).length, 0);
  assert.equal(seeds.length, 6);
});
test('unknown farm location never silently picks a weather region', () => {
  assert.equal(weather.inferWeatherLocation('Nông trại Củ Chi'), 'cu-chi');
  assert.equal(weather.inferWeatherLocation('Đà Lạt, Lâm Đồng'), 'da-lat');
  for (const address of ['', undefined, 'Lâm Đồng', 'TEST UI']) assert.equal(weather.inferWeatherLocation(address), null);
});
test('weather codes distinguish clear nights, rain, storms and missing data', () => {
  assert.equal(weather.weatherDescription(0, false), 'Trời quang');
  assert.equal(weather.weatherDescription(61), 'Có mưa');
  assert.equal(weather.weatherDescription(95), 'Mưa dông');
  assert.equal(weather.weatherDescription(null), 'Chưa có thông tin');
});
const fixture = { current: { time: '2026-09-23T09:15', temperature_2m: 0, relative_humidity_2m: 80, weather_code: 0, is_day: 1 },
  daily: { time: ['2026-09-23', '2026-09-24'], temperature_2m_min: [20, 21], temperature_2m_max: [29, 30], precipitation_probability_max: [0, null] } };
test('weather parser preserves zero values, missing forecast and Vietnam offset', () => {
  const result = weather.parseWeather(fixture);
  assert.equal(result.current.temperature, 0);
  assert.equal(result.current.time, '2026-09-23T09:15+07:00');
  assert.equal(result.daily[0].rainProbability, 0);
  assert.equal(result.daily[1].rainProbability, null);
  assert.throws(() => weather.parseWeather({}));
});
test('weather route rejects unapproved regions without contacting provider', async () => {
  let calls = 0;
  const route = load('app/api/weather/route.ts', { require: id => id === 'next/server'
    ? { NextResponse: { json: (data, options) => ({ data, ...options }) } } : weather,
    fetch: async () => { calls++; throw Error(); } });
  const result = await route.GET({ nextUrl: new URL('http://localhost/api/weather?location=anywhere') });
  assert.equal(result.status, 400);
  assert.equal(calls, 0);
});
test('weather route uses cache and returns 503 without invented weather when provider fails', async () => {
  const route = load('app/api/weather/route.ts', { require: id => id === 'next/server'
    ? { NextResponse: { json: (data, options) => ({ data, ...options }) } } : weather,
    fetch: async (url, options) => { assert.match(url, /latitude=10.9733/); assert.equal(options.next.revalidate, 900); throw Error('offline'); } });
  const result = await route.GET({ nextUrl: new URL('http://localhost/api/weather?location=cu-chi') });
  assert.equal(result.status, 503);
  assert.equal(result.data.current, undefined);
});
