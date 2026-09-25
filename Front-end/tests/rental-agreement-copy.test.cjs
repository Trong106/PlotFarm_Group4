const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('1. RentalAgreementModal component exists and has required elements', () => {
  const modalPath = path.join(__dirname, '../src/components/profile/RentalAgreementModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'RentalAgreementModal.tsx file must exist');

  const content = fs.readFileSync(modalPath, 'utf8');

  // Verify 4 core terms are present
  assert.match(content, /Thời hạn canh tác & Bàn giao đất/);
  assert.match(content, /Cam kết chuẩn sạch hữu cơ 100%/);
  assert.match(content, /Bảo hiểm rủi ro thiên tai & Bảo vệ năng suất/);
  assert.match(content, /Quy cách thu hoạch & Bàn giao tận nơi/);

  // Verify watermark & Canvas generator
  assert.match(content, /PLOTFARM - HỢP ĐỒNG ĐIỆN TỬ HỢP LỆ/);
  assert.match(content, /handleDownloadAgreement/);
  assert.match(content, /handlePrint/);
  assert.match(content, /HDDT-/);
});

test('2. Checkout VietQR syntax and quick-copy buttons exist', () => {
  const checkoutPath = path.join(__dirname, '../src/app/checkout/page.tsx');
  const content = fs.readFileSync(checkoutPath, 'utf8');

  // Verify transactionRef format has PLOTFARM_
  assert.match(content, /PLOTFARM_\$\{cleanCode\}_\$\{randomSuffix\}/);

  // Verify copy state and handlers
  assert.match(content, /copiedField/);
  assert.match(content, /handleCopyText/);
  assert.match(content, /handleCopyAllTransferInfo/);
  assert.match(content, /Đã chép/);
});

test('3. Profile page integrates RentalAgreementModal', () => {
  const profilePath = path.join(__dirname, '../src/app/profile/page.tsx');
  const content = fs.readFileSync(profilePath, 'utf8');

  assert.match(content, /RentalAgreementModal/);
  assert.match(content, /isAgreementModalOpen/);
  assert.match(content, /selectedAgreementOrder/);
  assert.match(content, /Xem Thỏa Thuận Thuê Đất/);
});
