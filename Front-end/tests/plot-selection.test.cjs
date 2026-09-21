const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/plot-selection.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, URL, URLSearchParams });
const { EMPTY_SELECTION, parsePlotQuery, writePlotQuery, validatePriceRange, filterPlots, normalizePlotSelection } = exportsObject;
const plain = (value) => JSON.parse(JSON.stringify(value));
const data = {
  areas: [{ AreaId: 7, SoilType: 'Đất thịt' }, { AreaId: 19, SoilType: 'Đất cát' }, { AreaId: 28, SoilType: 'Đất thịt' }],
  plots: [
    { PlotId: 101, AreaId: 7, BasePricePerMonth: 300000, Status: 'AVAILABLE' },
    { PlotId: 102, AreaId: 7, BasePricePerMonth: 500000, Status: 'RENTED' },
    { PlotId: 103, AreaId: 7, BasePricePerMonth: 700000, Status: 'AVAILABLE' },
    { PlotId: 201, AreaId: 19, BasePricePerMonth: 500000, Status: 'AVAILABLE' },
    { PlotId: 301, AreaId: 28, BasePricePerMonth: 600000, Status: 'AVAILABLE' },
  ],
  seeds: [{ SeedId: 9 }, { SeedId: 21 }], packages: [{ PackageId: 8 }, { PackageId: 15 }],
};

test('shared link restores selected plot, crop, package, filters and list mode', () => {
  const selection = normalizePlotSelection(parsePlotQuery(new URLSearchParams(
    'areaId=19&plotId=201&seedId=21&pkgId=15&view=list&status=AVAILABLE&minPrice=400000&maxPrice=600000&soil=Đất+cát'
  )), data);
  assert.deepEqual(plain(selection), {
    areaId: 19, plotId: 201, seedId: 21, pkgId: 15, view: 'LIST', status: 'AVAILABLE',
    minPrice: 400000, maxPrice: 600000, soil: 'Đất cát',
  });
  const restored = parsePlotQuery(writePlotQuery(new URL('https://example.test/plots'), selection).searchParams);
  assert.deepEqual(plain(restored), plain(selection));
});

test('invalid query values cannot create invalid IDs, filters or prices', () => {
  for (const value of ['-1', '0', '1.5', 'Infinity', 'abc', '9007199254740993', '1e2']) {
    const parsed = parsePlotQuery(new URLSearchParams(`plotId=${value}&seedId=${value}&pkgId=${value}&areaId=${value}`));
    for (const key of ['plotId', 'seedId', 'pkgId', 'areaId']) assert.equal(parsed[key], null);
  }
  const parsed = parsePlotQuery(new URLSearchParams('view=unknown&status=__proto__&minPrice=NaN&maxPrice=Infinity'));
  assert.equal(parsed.view, 'GRID');
  assert.equal(parsed.status, 'ALL');
  assert.equal(parsed.minPrice, null);
  assert.equal(parsed.maxPrice, null);
});

test('price validation accepts zero and open bounds, rejects negative and reversed ranges', () => {
  assert.deepEqual(plain(validatePriceRange('0', '')), { minPrice: 0, maxPrice: null, error: null });
  assert.deepEqual(plain(validatePriceRange('', '500000')), { minPrice: null, maxPrice: 500000, error: null });
  for (const [min, max] of [['-1', '2'], ['2', '1'], ['abc', ''], ['', 'Infinity']]) {
    assert.ok(validatePriceRange(min, max).error);
  }
});

test('area, soil, status and inclusive rental bounds apply together', () => {
  const selection = { ...EMPTY_SELECTION, areaId: 7, soil: 'Đất thịt', status: 'AVAILABLE', minPrice: 300000, maxPrice: 700000 };
  assert.deepEqual(Array.from(filterPlots(data.plots, data.areas, selection), p => p.PlotId), [101, 103]);
  assert.deepEqual(Array.from(filterPlots(data.plots, data.areas, { ...selection, maxPrice: 300000 }), p => p.PlotId), [101]);
  assert.equal(filterPlots(data.plots, data.areas, { ...selection, soil: 'Đất cát' }).length, 0);
});

test('shared plot resolves mismatched area and unavailable plots remain inspectable', () => {
  const selection = normalizePlotSelection({ ...EMPTY_SELECTION, areaId: 19, plotId: 102 }, data);
  assert.equal(selection.areaId, 7);
  assert.equal(selection.plotId, 102);
});

test('filtered-out selection is replaced with a visible plot, or cleared for no results', () => {
  const selection = normalizePlotSelection({ ...EMPTY_SELECTION, areaId: 7, plotId: 101, minPrice: 600000 }, data);
  assert.equal(selection.plotId, 103);
  const empty = normalizePlotSelection({ ...selection, minPrice: 800000 }, data);
  assert.equal(empty.plotId, null);
  assert.equal(empty.areaId, 7);
});

test('stale IDs normalize against loaded data without fake records', () => {
  const input = { ...EMPTY_SELECTION, areaId: 999, plotId: 999, seedId: 999, pkgId: 999, soil: 'Unknown soil' };
  const selection = normalizePlotSelection(input, data);
  assert.deepEqual([selection.areaId, selection.plotId, selection.seedId, selection.pkgId, selection.soil], [7, 101, 9, 8, '']);
  const empty = normalizePlotSelection(input, { areas: [], plots: [], seeds: [], packages: [] });
  for (const key of ['areaId', 'plotId', 'seedId', 'pkgId']) assert.equal(empty[key], null);
});

test('URL updates preserve unrelated params and hash and remove cleared filters', () => {
  const original = new URL('https://example.test/plots?utm_source=friend&minPrice=1&soil=old&plotId=999#details');
  const url = writePlotQuery(original, { ...EMPTY_SELECTION });
  assert.equal(url.searchParams.get('utm_source'), 'friend');
  assert.equal(url.hash, '#details');
  for (const key of ['minPrice', 'maxPrice', 'soil', 'plotId', 'areaId', 'status']) assert.equal(url.searchParams.has(key), false);
  assert.equal(original.searchParams.get('plotId'), '999');
});

test('rapid area transitions always reconcile the summary to the chosen area', () => {
  let current = normalizePlotSelection({ ...EMPTY_SELECTION }, data);
  for (let index = 0; index < 60; index++) {
    const areaId = [7, 19, 28][index % 3];
    current = normalizePlotSelection({ ...current, areaId, plotId: null }, data);
    assert.equal(current.areaId, areaId);
    assert.equal(data.plots.find(p => p.PlotId === current.plotId).AreaId, areaId);
    assert.deepEqual(plain(normalizePlotSelection(current, data)), plain(current));
  }
});

test('seed arrows select adjacent IDs and wrap in both directions', () => {
  const seeds = [{ SeedId: 3 }, { SeedId: 8 }, { SeedId: 21 }];
  const { adjacentSeedId } = exportsObject;
  assert.equal(adjacentSeedId(seeds, 3, 1), 8);
  assert.equal(adjacentSeedId(seeds, 8, -1), 3);
  assert.equal(adjacentSeedId(seeds, 21, 1), 3);
  assert.equal(adjacentSeedId(seeds, 3, -1), 21);
  let current = 3;
  for (let i = 0; i < 5; i++) current = adjacentSeedId(seeds, current, 1);
  assert.equal(current, 21);
});

test('seed navigation handles empty, single and stale selections', () => {
  const { adjacentSeedId } = exportsObject;
  assert.equal(adjacentSeedId([], null, 1), null);
  assert.equal(adjacentSeedId([{ SeedId: 8 }], 8, -1), 8);
  assert.equal(adjacentSeedId([{ SeedId: 3 }, { SeedId: 8 }], 99, 1), 3);
  assert.equal(adjacentSeedId([{ SeedId: 3 }, { SeedId: 8 }], null, -1), 8);
});
