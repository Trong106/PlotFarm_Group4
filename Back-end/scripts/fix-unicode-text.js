require('dotenv').config();
const { connectDB, executeQuery, closeDB } = require('../src/config/db');

async function fixUnicodeText() {
  try {
    console.log('[Fix Unicode] Connecting to SQL Server...');
    await connectDB();

    // 1. Fix FarmAreas
    console.log('[Fix Unicode] Fixing FarmAreas...');
    await executeQuery(`
      UPDATE FarmAreas SET 
        AreaName = N'Khu Rau Ăn Lá Hữu Cơ A', 
        SoilType = N'Đất đỏ bazan giàu mùn', 
        Description = N'Khu vực chuyên canh tác rau ăn lá ngắn ngày (Xà lách, Cải thìa, Rau muống)'
      WHERE AreaCode = 'AREA_A';

      UPDATE FarmAreas SET 
        AreaName = N'Khu Củ Quả & Thảo Dược B', 
        SoilType = N'Đất thịt pha cát tơi xốp', 
        Description = N'Khu vực luống cao thích hợp trồng Cà chua bi, Dưa leo baby, Ớt chuông'
      WHERE AreaCode = 'AREA_B';

      UPDATE FarmAreas SET 
        AreaName = N'Khu Vườn Ươm & Thảo Dược C', 
        SoilType = N'Đất phù sa giàu dinh dưỡng', 
        Description = N'Khu vực ươm giống và trồng thảo dược xanh hữu cơ'
      WHERE AreaCode = 'AREA_C';
    `);

    // 2. Fix Seeds
    console.log('[Fix Unicode] Fixing Seeds...');
    await executeQuery(`
      UPDATE Seeds SET 
        SeedName = N'Xà lách xoong Đà Lạt', 
        Description = N'Rau giòn ngọt, giàu sắt và vitamin A/C. Chu kỳ 35 ngày thu hoạch.',
        SuitableSoilType = N'Đất đỏ bazan'
      WHERE SeedId = 1;

      UPDATE Seeds SET 
        SeedName = N'Cải thìa baby thủy canh', 
        Description = N'Cải thìa ngọt mát, bẹ dày, thích hợp các món xào, luộc.',
        SuitableSoilType = N'Đất thịt phù sa'
      WHERE SeedId = 2;

      UPDATE Seeds SET 
        SeedName = N'Cà chua bi Cherry F1', 
        Description = N'Trái đỏ mọng, ngọt đậm đà, thu hoạch nhiều đợt kéo dài 30 ngày.',
        SuitableSoilType = N'Đất thịt pha cát'
      WHERE SeedId = 3;

      UPDATE Seeds SET 
        SeedName = N'Dưa leo baby giòn ngọt', 
        Description = N'Dưa leo baby năng suất cao, da bóng mượt, ăn tươi thanh mát.',
        SuitableSoilType = N'Đất phù sa tơi xốp'
      WHERE SeedId = 4;

      UPDATE Seeds SET 
        SeedName = N'Rau muống hạt hữu cơ', 
        Description = N'Rau muống cọng non xanh, lớn rất nhanh, dễ trồng.',
        SuitableSoilType = N'Đất phù sa ẩm'
      WHERE SeedId = 5;
    `);

    // 3. Fix CarePackages
    console.log('[Fix Unicode] Fixing CarePackages...');
    await executeQuery(`
      UPDATE CarePackages SET 
        PackageName = N'Gói Chăm Sóc Cơ Bản', 
        Description = N'Tưới nước tự động, kiểm tra định kỳ 2 lần/tuần, phân bón cơ bản.',
        ServicesIncluded = N'Tưới nước tự động, Nhặt cỏ định kỳ, Phân bón NPK cơ bản'
      WHERE PackageId = 1;

      UPDATE CarePackages SET 
        PackageName = N'Gói Chăm Sóc Nâng Cao', 
        Description = N'Tưới vi sinh trùn quế, tỉa cành bắt sâu daily, chụp ảnh nhật ký 3 lần/tuần.',
        ServicesIncluded = N'Tưới vi sinh trùn quế, Phun thảo mộc diệt sâu, Chụp ảnh nhật ký 3 lần/tuần, Tỉa lá chăm sóc'
      WHERE PackageId = 2;

      UPDATE CarePackages SET 
        PackageName = N'Gói Chăm Sóc VIP Chuyên Sâu', 
        Description = N'Chăm sóc riêng 1-on-1, camera AI giám sát 24/7, báo cáo nhật ký hằng ngày, bảo hiểm mất mùa.',
        ServicesIncluded = N'Kỹ thuật viên chăm sóc riêng 1-on-1, Camera AI theo dõi 24/7, Đăng nhật ký hàng ngày, Phân hữu cơ cao cấp'
      WHERE PackageId = 3;
    `);

    console.log('[Fix Unicode] SUCCESS! All Vietnamese text updated cleanly.');
    await closeDB();
  } catch (err) {
    console.error('[Fix Unicode] Error:', err);
  }
}

fixUnicodeText();
