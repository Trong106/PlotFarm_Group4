require('dotenv').config();
const { connectDB, executeQuery, closeDB } = require('../src/config/db');

async function seedAdditionalData() {
  try {
    console.log('[Seed Additional Data] Connecting to SQL Server...');
    await connectDB();

    // 1. Seed HarvestResults for HarvestRequestId = 1
    const checkHarvest = await executeQuery('SELECT 1 FROM HarvestResults WHERE HarvestRequestId = 1');
    if (checkHarvest.recordset.length === 0) {
      await executeQuery(`
        INSERT INTO HarvestResults (
          HarvestRequestId, StaffId, ActualYieldKg, QualityGrade, HarvestDate, InspectionNote, ProductImageUrl
        ) VALUES (
          1, 2, 36.00, N'GRADE_A', '2026-09-15 08:30:00',
          N'Rau xà lách xoong đạt chuẩn chất lượng Organic, lá to đều, không sâu bệnh.',
          'https://images.unsplash.com/photo-1540420773420-3366772f4999'
        )
      `);
      console.log('✅ Đã khởi tạo dữ liệu mẫu HarvestResults (Result cho HarvestRequestId 1)');
    } else {
      console.log('ℹ️ HarvestResults cho HarvestRequestId 1 đã tồn tại.');
    }

    // 2. Seed Notifications
    const checkNotif = await executeQuery('SELECT COUNT(*) as count FROM Notifications');
    if (checkNotif.recordset[0].count === 0) {
      await executeQuery(`
        INSERT INTO Notifications (UserId, Title, Message, Type, RelatedId, IsRead, CreatedAt)
        VALUES 
        (4, N'Giao hàng thành công', N'Đơn thu hoạch của bạn tại ô đất PLOT_A01 đã được giao thành công bởi GHTK Xe Lạnh.', 'HARVEST', 1, 0, DATEADD(hour, -2, SYSDATETIME())),
        (4, N'Nhật ký chăm sóc mới', N'Kỹ thuật viên Nguyễn Minh Khoa đã cập nhật nhật ký tưới vi sinh cho ô đất PLOT_A01.', 'LOG', 2, 0, DATEADD(hour, -5, SYSDATETIME())),
        (4, N'Thuê ô đất thành công', N'Ô đất PLOT_A01 đã được kích hoạt mùa vụ trồng Xà lách xoong Đà Lạt.', 'ORDER', 1, 1, DATEADD(day, -7, SYSDATETIME())),
        (5, N'Chào mừng thành viên mới', N'Chào mừng bạn đến với nông trại số PlotFarm! Hãy chọn ô đất và bắt đầu vụ mùa của mình.', 'SYSTEM', NULL, 0, DATEADD(day, -3, SYSDATETIME())),
        (2, N'Yêu cầu chăm sóc mới', N'Khách hàng Lê Văn Bình gửi yêu cầu tưới nước bổ sung cho ô đất PLOT_A01.', 'CARE_REQUEST', 1, 0, DATEADD(hour, -8, SYSDATETIME()))
      `);
      console.log('✅ Đã khởi tạo dữ liệu mẫu Notifications (5 thông báo cho Khách hàng & Kỹ thuật viên)');
    } else {
      console.log('ℹ️ Notifications đã có dữ liệu.');
    }

    await closeDB();
    console.log('[Seed Additional Data] Hoàn tất thành công!');
  } catch (err) {
    console.error('[Seed Additional Data] Error:', err);
    await closeDB();
  }
}

seedAdditionalData();
