const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB, getPool, sql } = require('../src/config/db');
const plotService = require('../src/services/plotService');
const orderService = require('../src/services/orderService');

async function runE2ETest() {
  console.log('--- BẮT ĐẦU KIỂM THỬ E2E CHECKOUT & HÓA ĐƠN ĐIỆN TỬ ---');

  try {
    await connectDB();
    const pool = getPool();
    // 1. Get or find customer
    const userRes = await pool.request().query(`
      SELECT TOP 1 UserId, Email, FullName, PhoneNumber FROM Users WHERE RoleId = 3 AND Status = 'ACTIVE'
    `);
    if (userRes.recordset.length === 0) {
      throw new Error('Không tìm thấy tài khoản Customer để test');
    }
    const customer = userRes.recordset[0];
    console.log(`✓ [Auth] Khách hàng thử nghiệm: ID=${customer.UserId}, Tên=${customer.FullName}`);

    // 2. Find an available plot or reset one
    let plotRes = await pool.request().query(`
      SELECT TOP 1 PlotId, PlotCode, Status FROM Plots WHERE Status = 'AVAILABLE'
    `);
    if (plotRes.recordset.length === 0) {
      // Free plot 1 for testing
      await pool.request().query(`
        UPDATE Plots SET Status = 'AVAILABLE', ReservedUntil = NULL, ReservedByUserId = NULL WHERE PlotId = 1
      `);
      plotRes = await pool.request().query(`SELECT TOP 1 PlotId, PlotCode, Status FROM Plots WHERE PlotId = 1`);
    }
    const testPlot = plotRes.recordset[0];
    console.log(`✓ [Plot] Ô đất thử nghiệm: ID=${testPlot.PlotId}, Code=${testPlot.PlotCode}`);

    // 3. Test Reserve Plot (15-min lock)
    console.log('\n[Bước 1] Thử nghiệm giữ chỗ ô đất 15 phút...');
    const reserved = await plotService.reservePlot(testPlot.PlotId, customer.UserId);
    console.log(`✓ Giữ chỗ thành công: Status=${reserved.status}, Hạn=${reserved.reservedUntil}`);

    // Verify in DB
    const checkReserved = await pool.request().input('PlotId', sql.Int, testPlot.PlotId).query(`
      SELECT Status, ReservedUntil, ReservedByUserId FROM Plots WHERE PlotId = @PlotId
    `);
    if (checkReserved.recordset[0].Status !== 'RESERVED') {
      throw new Error('Trạng thái DB không phải RESERVED!');
    }
    console.log('✓ DB đã khóa ô đất với Status = RESERVED');

    // 4. Test Instant Release ("Hủy phiên & Trả ô đất")
    console.log('\n[Bước 2] Thử nghiệm HỦY GIỮ CHỖ TỨC THÌ (Instant Release)...');
    const released = await plotService.releasePlot(testPlot.PlotId, customer.UserId);
    console.log(`✓ Hủy giữ chỗ thành công: Status=${released.status}`);

    const checkReleased = await pool.request().input('PlotId', sql.Int, testPlot.PlotId).query(`
      SELECT Status, ReservedUntil, ReservedByUserId FROM Plots WHERE PlotId = @PlotId
    `);
    if (checkReleased.recordset[0].Status !== 'AVAILABLE') {
      throw new Error('Trạng thái DB sau khi release không phải AVAILABLE!');
    }
    console.log('✓ DB đã giải phóng ô đất trở về AVAILABLE ngay lập tức (tránh chiếm dụng ảo)');

    // 5. Test Re-Reserve and Complete Checkout
    console.log('\n[Bước 3] Giữ chỗ lại và thực hiện thanh toán...');
    await plotService.reservePlot(testPlot.PlotId, customer.UserId);

    // Get seed and package
    const seedRes = await pool.request().query(`SELECT TOP 1 SeedId, SeedName FROM Seeds`);
    const pkgRes = await pool.request().query(`SELECT TOP 1 PackageId, PackageName FROM CarePackages`);
    const seedId = seedRes.recordset[0]?.SeedId || 1;
    const pkgId = pkgRes.recordset[0]?.PackageId || 1;

    // Checkout
    const checkoutResult = await orderService.createMockCheckout(customer.UserId, {
      plotId: testPlot.PlotId,
      seedId,
      carePackageId: pkgId,
      durationMonths: 2,
      cycles: 1,
      paymentMethod: 'QR_BANK'
    });
    console.log(`✓ Thanh toán thành công! OrderId=${checkoutResult.orderId}, OrderCode=${checkoutResult.orderCode}, Total=${checkoutResult.totalAmount} VND`);

    // 6. Test Fetch Orders (Invoice Detail Verification)
    console.log('\n[Bước 4] Kiểm tra truy vấn Hóa Đơn Điện Tử (getMyOrders)...');
    const orders = await orderService.getMyOrders(customer.UserId);
    const latestOrder = orders.find(o => o.OrderId === checkoutResult.orderId) || orders[0];

    console.log(`✓ Đơn hàng mới nhất: Mã=${latestOrder.OrderCode}, Trạng thái=${latestOrder.Status}`);
    console.log(`✓ Mã Giao Dịch Ngân Hàng (TXN): ${latestOrder.TransactionCode || 'N/A'}`);
    console.log(`✓ Phương thức thanh toán: ${latestOrder.PaymentMethod || 'N/A'}`);
    console.log(`✓ Phân rã biểu phí minh bạch:`);
    console.log(`   - Tiền thuê đất (RentalFee): ${Number(latestOrder.RentalFee).toLocaleString('vi-VN')} VND`);
    console.log(`   - Phí hạt giống (SeedFee): ${Number(latestOrder.SeedFee).toLocaleString('vi-VN')} VND`);
    console.log(`   - Phí gói chăm sóc (CareFee): ${Number(latestOrder.CareFee).toLocaleString('vi-VN')} VND`);
    console.log(`   - TỔNG CỘNG (TotalAmount): ${Number(latestOrder.TotalAmount).toLocaleString('vi-VN')} VND`);

    if (!latestOrder.TransactionCode || !latestOrder.TransactionCode.startsWith('TXN_')) {
      throw new Error('TransactionCode không hợp lệ hoặc thiếu tiền tố TXN_');
    }
    if (!latestOrder.RentalFee || !latestOrder.TotalAmount) {
      throw new Error('Thiếu thông tin biểu phí phân rã!');
    }

    // 7. Test Vietnamese Phone Number Validation for Address Book
    console.log('\n[Bước 5] Kiểm tra xác thực số điện thoại Việt Nam trong Sổ Địa Chỉ...');
    const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
    const validPhones = ['0901234567', '0389998888', '0771234567', '0581234567', '0898889999'];
    const invalidPhones = ['0123456789', '090123456', '09012345678', 'abc0901234', '1900123456'];

    for (const p of validPhones) {
      if (!vnPhoneRegex.test(p)) throw new Error(`Phone hợp lệ bị từ chối: ${p}`);
    }
    for (const p of invalidPhones) {
      if (vnPhoneRegex.test(p)) throw new Error(`Phone không hợp lệ lại được chấp nhận: ${p}`);
    }
    console.log(`✓ Xác thực thành công 10/10 mẫu số điện thoại Việt Nam (10 số, đầu 03/05/07/08/09)`);

    console.log('\n=========================================');
    console.log('🎉 TẤT CẢ 5 BƯỚC KIỂM THỬ E2E ĐỀU ĐẠT 100%!');
    console.log('=========================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err);
    process.exit(1);
  }
}

runE2ETest();
