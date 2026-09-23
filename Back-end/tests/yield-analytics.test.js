/**
 * @file yield-analytics.test.js
 * @description Kiểm thử API Phân tích Sản lượng Vụ mùa (Yield Analytics)
 * Endpoint: GET /api/cultivations/:id/yield-analytics
 * Hệ thống: PlotFarm Team 4
 */

const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { connectDB, closeDB } = require('../src/config/db');
const { generateToken } = require('../src/utils/jwtHelper');

let server;
let baseUrl;
let customerToken;
let staffToken;

before(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Test] DB connection warning:', err.message);
  }
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  customerToken = generateToken({ userId: 4, role: 'Customer', fullName: 'Lê Văn Bình' });
  staffToken = generateToken({ userId: 2, role: 'Staff', fullName: 'Trần Minh Tuấn' });
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
  try { await closeDB(); } catch (e) {}
});

const apiRequest = async (endpoint, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET', headers });
  let data;
  try { data = await response.json(); } catch (e) { data = null; }
  return { status: response.status, data };
};

// ============================================================================
// BỘ KIỂM THỬ: YIELD ANALYTICS API
// ============================================================================

test('PHÂN TÍCH SẢN LƯỢNG VỤ MÙA (YIELD ANALYTICS)', async (t) => {

  await t.test('1. Truy cập không có token xác thực trả về 401 Unauthorized', async () => {
    const { status, data } = await apiRequest('/api/cultivations/1/yield-analytics');
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });

  await t.test('2. CultivationId không hợp lệ (chữ cái) trả về 400 Bad Request', async () => {
    const { status, data } = await apiRequest('/api/cultivations/abc/yield-analytics', customerToken);
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.ok(data.message.includes('không hợp lệ'));
  });

  await t.test('3. CultivationId số âm trả về 400 Bad Request', async () => {
    const { status, data } = await apiRequest('/api/cultivations/-5/yield-analytics', customerToken);
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });

  await t.test('4. CultivationId = 0 trả về 400 Bad Request', async () => {
    const { status, data } = await apiRequest('/api/cultivations/0/yield-analytics', customerToken);
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });

  await t.test('5. CultivationId không tồn tại trả về 404 Not Found', async () => {
    const { status, data } = await apiRequest('/api/cultivations/999999/yield-analytics', customerToken);
    assert.equal(status, 404);
    assert.equal(data.success, false);
  });

  await t.test('6. Lấy phân tích sản lượng thành công (CultivationId = 1)', async () => {
    const { status, data } = await apiRequest('/api/cultivations/1/yield-analytics', customerToken);

    // API phải trả về 200 (hoặc 404 nếu DB chưa có cultivation 1)
    assert.ok([200, 404].includes(status), `Mã trạng thái: ${status}`);

    if (status === 200) {
      assert.equal(data.success, true);
      const d = data.data;

      // Kiểm tra cấu trúc response bắt buộc
      assert.ok('cultivationId' in d, 'Thiếu cultivationId');
      assert.ok('plotCode' in d, 'Thiếu plotCode');
      assert.ok('sizeM2' in d, 'Thiếu sizeM2');
      assert.ok('seedName' in d, 'Thiếu seedName');
      assert.ok('expectedYieldKgPerM2' in d, 'Thiếu expectedYieldKgPerM2');
      assert.ok('expectedYieldKg' in d, 'Thiếu expectedYieldKg');
      assert.ok('actualYieldKg' in d, 'Thiếu actualYieldKg');
      assert.ok('completionRate' in d, 'Thiếu completionRate');
      assert.ok('cultivationStatus' in d, 'Thiếu cultivationStatus');
      assert.ok('totalHarvests' in d, 'Thiếu totalHarvests');
      assert.ok('harvests' in d, 'Thiếu harvests');
      assert.ok('yieldGap' in d, 'Thiếu yieldGap');
      assert.ok('yieldGapPercent' in d, 'Thiếu yieldGapPercent');
      assert.ok('assessment' in d, 'Thiếu assessment');

      // Kiểm tra kiểu dữ liệu
      assert.equal(typeof d.cultivationId, 'number');
      assert.equal(typeof d.sizeM2, 'number');
      assert.equal(typeof d.expectedYieldKg, 'number');
      assert.equal(typeof d.actualYieldKg, 'number');
      assert.equal(typeof d.completionRate, 'number');
      assert.ok(Array.isArray(d.harvests), 'harvests phải là mảng');
      assert.equal(typeof d.totalHarvests, 'number');
      assert.equal(typeof d.assessment, 'string');

      // Kiểm tra công thức tính sản lượng dự kiến
      const calcExpected = parseFloat((d.sizeM2 * d.expectedYieldKgPerM2).toFixed(2));
      assert.equal(d.expectedYieldKg, calcExpected,
        `expectedYieldKg (${d.expectedYieldKg}) phải = sizeM2 (${d.sizeM2}) × expectedYieldKgPerM2 (${d.expectedYieldKgPerM2}) = ${calcExpected}`
      );

      // Kiểm tra completionRate tính đúng
      if (d.expectedYieldKg > 0) {
        const calcRate = parseFloat(((d.actualYieldKg / d.expectedYieldKg) * 100).toFixed(2));
        assert.equal(d.completionRate, calcRate,
          `completionRate (${d.completionRate}) phải = (actualYieldKg / expectedYieldKg) × 100 = ${calcRate}`
        );
      }

      // Kiểm tra yieldGap tính đúng
      const calcGap = parseFloat((d.actualYieldKg - d.expectedYieldKg).toFixed(2));
      assert.equal(d.yieldGap, calcGap,
        `yieldGap (${d.yieldGap}) phải = actualYieldKg - expectedYieldKg = ${calcGap}`
      );

      // Kiểm tra assessment hợp lệ
      const validAssessments = ['XUẤT SẮC', 'KHÁ', 'TRUNG BÌNH', 'CHƯA ĐẠT', 'CHƯA THU HOẠCH'];
      assert.ok(validAssessments.includes(d.assessment),
        `assessment "${d.assessment}" phải nằm trong ${JSON.stringify(validAssessments)}`
      );

      // Kiểm tra totalHarvests khớp với mảng harvests
      assert.equal(d.totalHarvests, d.harvests.length,
        'totalHarvests phải khớp với harvests.length'
      );

      // Nếu có harvests, kiểm tra cấu trúc từng item
      if (d.harvests.length > 0) {
        const h = d.harvests[0];
        assert.ok('resultId' in h, 'harvest item thiếu resultId');
        assert.ok('actualYieldKg' in h, 'harvest item thiếu actualYieldKg');
        assert.ok('qualityGrade' in h, 'harvest item thiếu qualityGrade');
        assert.ok('harvestDate' in h, 'harvest item thiếu harvestDate');
        assert.ok('staffName' in h, 'harvest item thiếu staffName');
      }

      console.log(`   ✓ Vụ mùa #${d.cultivationId}: ${d.seedName} trên ${d.plotCode}`);
      console.log(`     Sản lượng dự kiến: ${d.expectedYieldKg} kg (${d.sizeM2}m² × ${d.expectedYieldKgPerM2} kg/m²)`);
      console.log(`     Sản lượng thực tế: ${d.actualYieldKg} kg (${d.totalHarvests} lần thu hoạch)`);
      console.log(`     Tỷ lệ hoàn thành: ${d.completionRate}% — Đánh giá: ${d.assessment}`);
    }
  });

  await t.test('7. Staff cũng có quyền xem phân tích sản lượng (CultivationId = 1)', async () => {
    const { status, data } = await apiRequest('/api/cultivations/1/yield-analytics', staffToken);
    assert.ok([200, 404].includes(status), `Staff truy cập yield-analytics: ${status}`);
    if (status === 200) {
      assert.equal(data.success, true);
      assert.ok(data.data.cultivationId === 1);
    }
  });
});

// ============================================================================
// UNIT TEST: Yield Analytics Assessment Logic (không cần DB)
// ============================================================================

test('Yield Analytics Assessment Logic: đánh giá mức đạt sản lượng', async (t) => {

  // Hàm assessment thuần logic, tách ra để test độc lập
  const getAssessment = (completionRate, actualYieldKg, harvestCount) => {
    if (actualYieldKg === 0 && harvestCount === 0) return 'CHƯA THU HOẠCH';
    if (completionRate >= 100) return 'XUẤT SẮC';
    if (completionRate >= 80) return 'KHÁ';
    if (completionRate >= 50) return 'TRUNG BÌNH';
    return 'CHƯA ĐẠT';
  };

  await t.test('Chưa thu hoạch (0 kg, 0 lần) → CHƯA THU HOẠCH', () => {
    assert.equal(getAssessment(0, 0, 0), 'CHƯA THU HOẠCH');
  });

  await t.test('Hoàn thành 120% → XUẤT SẮC', () => {
    assert.equal(getAssessment(120, 54, 2), 'XUẤT SẮC');
  });

  await t.test('Hoàn thành đúng 100% → XUẤT SẮC', () => {
    assert.equal(getAssessment(100, 45, 1), 'XUẤT SẮC');
  });

  await t.test('Hoàn thành 85% → KHÁ', () => {
    assert.equal(getAssessment(85, 38.25, 1), 'KHÁ');
  });

  await t.test('Hoàn thành đúng 80% → KHÁ', () => {
    assert.equal(getAssessment(80, 36, 1), 'KHÁ');
  });

  await t.test('Hoàn thành 65% → TRUNG BÌNH', () => {
    assert.equal(getAssessment(65, 29.25, 1), 'TRUNG BÌNH');
  });

  await t.test('Hoàn thành đúng 50% → TRUNG BÌNH', () => {
    assert.equal(getAssessment(50, 22.5, 1), 'TRUNG BÌNH');
  });

  await t.test('Hoàn thành 30% → CHƯA ĐẠT', () => {
    assert.equal(getAssessment(30, 13.5, 1), 'CHƯA ĐẠT');
  });

  await t.test('Hoàn thành 0% nhưng có 1 lần thu hoạch (0 kg) → CHƯA ĐẠT', () => {
    assert.equal(getAssessment(0, 0, 1), 'CHƯA ĐẠT');
  });

  await t.test('Tính expectedYieldKg = sizeM2 × yieldPerM2', () => {
    const sizeM2 = 15.0;
    const yieldPerM2 = 3.0;
    const expected = parseFloat((sizeM2 * yieldPerM2).toFixed(2));
    assert.equal(expected, 45.0);
  });

  await t.test('Tính completionRate = (actual / expected) × 100', () => {
    const actual = 38.5;
    const expected = 45.0;
    const rate = parseFloat(((actual / expected) * 100).toFixed(2));
    assert.equal(rate, 85.56);
  });

  await t.test('Tính yieldGap = actual - expected', () => {
    const actual = 38.5;
    const expected = 45.0;
    const gap = parseFloat((actual - expected).toFixed(2));
    assert.equal(gap, -6.5);
  });
});
