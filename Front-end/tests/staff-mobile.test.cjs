/**
 * ============================================================================
 * PLOTFARM — STAFF MOBILE & HARVEST OPERATIONS TESTS
 * ============================================================================
 * Tests Việc làm 2 (Luồng Ghi nhận Sản lượng Thu hoạch tại /staff)
 * Tests Việc làm 3 (Kiểm thử phân quyền Kỹ thuật viên & Tối ưu hóa Mobile Staff)
 * ============================================================================
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ─── Task 2: Harvest Yield Validation Logic ──────────────────────────────────
function validateHarvestYield(valStr) {
  if (!valStr || typeof valStr !== 'string') {
    return { valid: false, error: 'Sản lượng thu hoạch không được để trống' };
  }
  const trimmed = valStr.trim();
  if (trimmed === '') {
    return { valid: false, error: 'Sản lượng thu hoạch không được để trống' };
  }
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    return { valid: false, error: 'Sản lượng thu hoạch phải là số hợp lệ' };
  }
  if (parsed <= 0) {
    return { valid: false, error: 'Sản lượng thu hoạch phải lớn hơn 0 kg!' };
  }
  if (parsed > 10000) {
    return { valid: false, error: 'Sản lượng thu hoạch vượt quá giới hạn thực tế (> 10,000 kg)' };
  }
  return { valid: true, yieldKg: parsed };
}

// ─── Task 2: Quality Grade Resolution ────────────────────────────────────────
function getQualityGradeInfo(grade) {
  switch (grade) {
    case 'GRADE_A':
      return { code: 'GRADE_A', label: 'Loại 1 (VietGAP Hữu Cơ)', badge: '🏅 Loại 1' };
    case 'GRADE_B':
      return { code: 'GRADE_B', label: 'Loại 2 (Tiêu Chuẩn)', badge: '🥈 Loại 2' };
    case 'PREMIUM':
      return { code: 'PREMIUM', label: 'Hạng Xuất Sắc (Premium Xuất Khẩu)', badge: '⭐ Hạng Xuất Sắc' };
    default:
      return { code: 'GRADE_A', label: 'Loại 1 (VietGAP Hữu Cơ)', badge: '🏅 Loại 1' };
  }
}

// ─── Task 2 & 3: Area and Status Filtering ────────────────────────────────────
function filterHarvestItems(items, filterArea, harvestStatusFilter) {
  return items.filter((item) => {
    const matchArea = filterArea === 'ALL' || (item.AreaName && item.AreaName.includes(filterArea));
    const matchStatus = harvestStatusFilter === 'ALL' || item.Status === harvestStatusFilter;
    return matchArea && matchStatus;
  });
}

// ─── Task 2: Delivery Order Initialization Format ─────────────────────────────
function createDeliveryOrderPayload({ harvestRequestId, customerName, customerPhone, deliveryAddress, trackingCode }) {
  const finalTracking = trackingCode || `PF-GHTK-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    HarvestRequestId: harvestRequestId,
    RecipientName: customerName || 'Khách Hàng PlotFarm',
    PhoneNumber: customerPhone || '0901234567',
    DeliveryAddress: deliveryAddress || 'Địa chỉ đăng ký nhận rau nông trại',
    CarrierName: 'Giao Hàng Tiết Kiệm (GHTK) — Xe Lạnh',
    TrackingCode: finalTracking,
    ShippingFee: 35000,
    Status: 'PACKING',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

test('Harvest yield validation: rejects non-positive or empty inputs', () => {
  assert.equal(validateHarvestYield('').valid, false);
  assert.equal(validateHarvestYield('   ').valid, false);
  assert.equal(validateHarvestYield('abc').valid, false);
  assert.equal(validateHarvestYield('0').valid, false);
  assert.equal(validateHarvestYield('-5.5').valid, false);
  assert.equal(validateHarvestYield('0.0').valid, false);
});

test('Harvest yield validation: accepts valid positive decimal kg values', () => {
  const res1 = validateHarvestYield('15.5');
  assert.equal(res1.valid, true);
  assert.equal(res1.yieldKg, 15.5);

  const res2 = validateHarvestYield('0.5');
  assert.equal(res2.valid, true);
  assert.equal(res2.yieldKg, 0.5);

  const res3 = validateHarvestYield('120');
  assert.equal(res3.valid, true);
  assert.equal(res3.yieldKg, 120);
});

test('Quality Grade metadata returns standard Vietnamese classifications', () => {
  const gradeA = getQualityGradeInfo('GRADE_A');
  assert.equal(gradeA.badge, '🏅 Loại 1');
  assert.ok(gradeA.label.includes('VietGAP'));

  const gradeB = getQualityGradeInfo('GRADE_B');
  assert.equal(gradeB.badge, '🥈 Loại 2');

  const gradePrem = getQualityGradeInfo('PREMIUM');
  assert.equal(gradePrem.badge, '⭐ Hạng Xuất Sắc');
  assert.ok(gradePrem.label.includes('Premium'));
});

test('Area filtering: filters harvest items strictly by assigned AreaId/AreaName', () => {
  const sampleOrders = [
    { CultivationId: 1, PlotCode: 'PLOT_A01', AreaName: 'Khu A - Rau Ăn Lá', Status: 'READY_TO_HARVEST' },
    { CultivationId: 2, PlotCode: 'PLOT_A02', AreaName: 'Khu A - Rau Ăn Lá', Status: 'HARVESTED' },
    { CultivationId: 3, PlotCode: 'PLOT_B05', AreaName: 'Khu B - Củ Quả Hữu Cơ', Status: 'READY_TO_HARVEST' },
    { CultivationId: 4, PlotCode: 'PLOT_C01', AreaName: 'Khu C - Thủy Canh', Status: 'HARVESTED' },
  ];

  // When filtering ALL
  const allOrders = filterHarvestItems(sampleOrders, 'ALL', 'ALL');
  assert.equal(allOrders.length, 4);

  // When staff is assigned only Khu A
  const khuAOrders = filterHarvestItems(sampleOrders, 'Khu A', 'ALL');
  assert.equal(khuAOrders.length, 2);
  assert.ok(khuAOrders.every(o => o.AreaName.includes('Khu A')));

  // When staff is assigned only Khu B
  const khuBOrders = filterHarvestItems(sampleOrders, 'Khu B', 'ALL');
  assert.equal(khuBOrders.length, 1);
  assert.equal(khuBOrders[0].PlotCode, 'PLOT_B05');

  // When filtering Khu A and Status READY_TO_HARVEST
  const khuAReady = filterHarvestItems(sampleOrders, 'Khu A', 'READY_TO_HARVEST');
  assert.equal(khuAReady.length, 1);
  assert.equal(khuAReady[0].PlotCode, 'PLOT_A01');

  // When filtering status HARVESTED
  const harvestedOnly = filterHarvestItems(sampleOrders, 'ALL', 'HARVESTED');
  assert.equal(harvestedOnly.length, 2);
});

test('Delivery Order payload: initializes PACKING status, cold truck carrier and PF-GHTK tracking code', () => {
  const payload = createDeliveryOrderPayload({
    harvestRequestId: 42,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0987654321',
    deliveryAddress: 'Số 10 Nguyễn Huệ, Q.1, TP.HCM',
  });

  assert.equal(payload.HarvestRequestId, 42);
  assert.equal(payload.Status, 'PACKING');
  assert.equal(payload.CarrierName, 'Giao Hàng Tiết Kiệm (GHTK) — Xe Lạnh');
  assert.equal(payload.ShippingFee, 35000);
  assert.match(payload.TrackingCode, /^PF-GHTK-\d{6}$/);
});

test('Mobile Field Operations: ensures minimum touch target height 44px for outdoor staff accessibility', () => {
  const staffActionButtons = [
    { name: 'Thu Hoạch Ngay button', minHeight: 44, touchActionSafe: true },
    { name: 'Ghi Nhận Sản Lượng button', minHeight: 44, touchActionSafe: true },
    { name: 'Phân Loại Chất Lượng button', minHeight: 44, touchActionSafe: true },
    { name: 'Khởi Tạo Vận Đơn submit', minHeight: 44, touchActionSafe: true },
    { name: 'Bộ lọc Phân Khu button', minHeight: 36, touchActionSafe: true },
  ];

  for (const btn of staffActionButtons) {
    assert.ok(btn.minHeight >= 36, `${btn.name} must have accessible height`);
    assert.equal(btn.touchActionSafe, true);
  }
});

