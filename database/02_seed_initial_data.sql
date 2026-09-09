-- ============================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC TRỰC TUYẾN (PLOTFARM)
-- TÁC GIẢ: Trọng (Database Architect & Backend Leader)
-- FILE: 02_seed_initial_data.sql - BỘ DỮ LIỆU KHỞI TẠO MẪU (DEMO SEED DATA)
-- ============================================================================

USE PlotFarmDB;
GO

SET NOCOUNT ON;

-- 1. NẠP DỮ LIỆU ROLES
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO dbo.Roles (RoleName, Description) VALUES
    ('Admin', N'Quản trị viên toàn hệ thống'),
    ('Staff', N'Nhân viên kỹ thuật nông trại'),
    ('Customer', N'Khách hàng thuê đất online');
    PRINT N'Nạp 3 Roles thành công!';
END
GO

-- 2. NẠP DỮ LIỆU USERS
-- Mật khẩu mặc định demo: "123456" (đã băm bằng bcrypt: $2a$10$abcdefghijklmnopqrstuv...)
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'admin@plotfarm.vn')
BEGIN
    INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, AvatarUrl, Status) VALUES
    (1, N'Trần Quản Trị', 'admin@plotfarm.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMye.I5X4v8C4vI/fHh3F36c0aA1YJzY7QO', '0901234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'ACTIVE'),
    (2, N'Nguyễn Văn Đức (Kỹ Thuật)', 'staff1@plotfarm.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMye.I5X4v8C4vI/fHh3F36c0aA1YJzY7QO', '0912345678', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'ACTIVE'),
    (2, N'Lê Minh Nhật (Chăm Sóc)', 'staff2@plotfarm.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMye.I5X4v8C4vI/fHh3F36c0aA1YJzY7QO', '0923456789', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'ACTIVE'),
    (3, N'Phạm Thị Trà My (Khách Mới)', 'khachmoi@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.I5X4v8C4vI/fHh3F36c0aA1YJzY7QO', '0987654321', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'ACTIVE'),
    (3, N'Hoàng Anh Tuấn (Khách Đang Có Vườn)', 'nghiemthu@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.I5X4v8C4vI/fHh3F36c0aA1YJzY7QO', '0978901234', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61', 'ACTIVE');
    PRINT N'Nạp 5 Users mẫu thành công!';
END
GO

-- 3. NẠP ĐỊA CHỈ NHẬN HÀNG
IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE RecipientName = N'Hoàng Anh Tuấn')
BEGIN
    INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, Province, District, Ward, AddressDetail, IsDefault) VALUES
    (5, N'Hoàng Anh Tuấn', '0978901234', N'Thành phố Hồ Chí Minh', N'Quận 1', N'Phường Bến Nghé', N'Số 123 Đường Lê Lợi', 1),
    (4, N'Phạm Thị Trà My', '0987654321', N'Thành phố Hồ Chí Minh', N'Thành phố Thủ Đức', N'Phường Thảo Điền', N'Chung cư Tropic Garden, Tháp A1, P.802', 1);
    PRINT N'Nạp UserAddresses thành công!';
END
GO

-- 4. NẠP NÔNG TRẠI & PHÂN KHU CANH TÁC
IF NOT EXISTS (SELECT 1 FROM dbo.Farms WHERE FarmName LIKE N'%PlotFarm%')
BEGIN
    INSERT INTO dbo.Farms (FarmName, Address, Hotline, TotalAreaM2, Description, Latitude, Longitude, MaxDeliveryRadiusKm) VALUES
    (N'Nông Trại Thông Minh PlotFarm Đà Lạt', N'Thôn Măng Lin, Phường 7, TP. Đà Lạt, Tỉnh Lâm Đồng', '1900 6868', 25000.0, N'Tổ hợp nông nghiệp công nghệ cao ứng dụng IoT giám sát trực tiếp, canh tác rau hữu cơ chuẩn VietGAP & GlobalGAP.', 11.9754, 108.4021, 40);
    PRINT N'Nạp Farm thành công!';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.FarmAreas WHERE AreaCode = 'AREA_A')
BEGIN
    INSERT INTO dbo.FarmAreas (FarmId, AreaCode, AreaName, SoilType, TotalPlots, Description) VALUES
    (1, 'AREA_A', N'Khu Rau Ăn Lá Hữu Cơ A', N'Đất đỏ bazan giàu mùn', 9, N'Khu vực chuyên canh tác rau ăn lá ngắn ngày (Xà lách, Cải thìa, Rau muống)'),
    (1, 'AREA_B', N'Khu Củ Quả & Thảo Dược B', N'Đất thịt pha cát tơi xốp', 6, N'Khu vực luống cao thích hợp trồng Cà chua bi, Dưa leo baby, ớt chuông');
    PRINT N'Nạp 2 FarmAreas thành công!';
END
GO

-- 5. NẠP CAMERAS
IF NOT EXISTS (SELECT 1 FROM dbo.Cameras WHERE CameraCode = 'CAM_P01')
BEGIN
    INSERT INTO dbo.Cameras (CameraCode, CameraName, StreamUrl, TimelapseUrl, Status) VALUES
    ('CAM_P01', N'Camera Giám Sát Ô A01', 'https://plotfarm.vn/live/stream_a01.m3u8', 'https://plotfarm.vn/timelapse/a01_growth.mp4', 'ONLINE'),
    ('CAM_P02', N'Camera Giám Sát Ô A02', 'https://plotfarm.vn/live/stream_a02.m3u8', 'https://plotfarm.vn/timelapse/a02_growth.mp4', 'ONLINE'),
    ('CAM_P03', N'Camera Giám Sát Ô A03', 'https://plotfarm.vn/live/stream_a03.m3u8', 'https://plotfarm.vn/timelapse/a03_growth.mp4', 'ONLINE'),
    ('CAM_P04', N'Camera Giám Sát Ô A04', 'https://plotfarm.vn/live/stream_a04.m3u8', 'https://plotfarm.vn/timelapse/a04_growth.mp4', 'ONLINE'),
    ('CAM_P05', N'Camera Giám Sát Ô A05', 'https://plotfarm.vn/live/stream_a05.m3u8', 'https://plotfarm.vn/timelapse/a05_growth.mp4', 'ONLINE'),
    ('CAM_P06', N'Camera Giám Sát Ô A06', 'https://plotfarm.vn/live/stream_a06.m3u8', 'https://plotfarm.vn/timelapse/a06_growth.mp4', 'ONLINE'),
    ('CAM_P07', N'Camera Giám Sát Ô A07', 'https://plotfarm.vn/live/stream_a07.m3u8', 'https://plotfarm.vn/timelapse/a07_growth.mp4', 'ONLINE'),
    ('CAM_P08', N'Camera Giám Sát Ô A08', 'https://plotfarm.vn/live/stream_a08.m3u8', 'https://plotfarm.vn/timelapse/a08_growth.mp4', 'ONLINE'),
    ('CAM_P09', N'Camera Giám Sát Ô A09', 'https://plotfarm.vn/live/stream_a09.m3u8', 'https://plotfarm.vn/timelapse/a09_growth.mp4', 'ONLINE'),
    ('CAM_P10', N'Camera Giám Sát Ô B01', 'https://plotfarm.vn/live/stream_b01.m3u8', 'https://plotfarm.vn/timelapse/b01_growth.mp4', 'ONLINE'),
    ('CAM_P11', N'Camera Giám Sát Ô B02', 'https://plotfarm.vn/live/stream_b02.m3u8', 'https://plotfarm.vn/timelapse/b02_growth.mp4', 'ONLINE'),
    ('CAM_P12', N'Camera Giám Sát Ô B03', 'https://plotfarm.vn/live/stream_b03.m3u8', 'https://plotfarm.vn/timelapse/b03_growth.mp4', 'ONLINE'),
    ('CAM_P13', N'Camera Giám Sát Ô B04', 'https://plotfarm.vn/live/stream_b04.m3u8', 'https://plotfarm.vn/timelapse/b04_growth.mp4', 'ONLINE'),
    ('CAM_P14', N'Camera Giám Sát Ô B05', 'https://plotfarm.vn/live/stream_b05.m3u8', 'https://plotfarm.vn/timelapse/b05_growth.mp4', 'ONLINE'),
    ('CAM_P15', N'Camera Giám Sát Ô B06', 'https://plotfarm.vn/live/stream_b06.m3u8', 'https://plotfarm.vn/timelapse/b06_growth.mp4', 'ONLINE');
    PRINT N'Nạp 15 Cameras thành công!';
END
GO

-- 6. NẠP 15 Ô ĐẤT ĐỦ 5 TRẠNG THÁI (Chuẩn bị theo Tuần 3 & Tuần 13)
IF NOT EXISTS (SELECT 1 FROM dbo.Plots WHERE PlotCode = 'PLOT_A01')
BEGIN
    INSERT INTO dbo.Plots (AreaId, CameraId, PlotCode, RowNum, ColNum, SizeM2, SoilPH, StandardHumidity, BasePricePerMonth, Status, ReservedUntil, ReservedByUserId, FallowingUntil) VALUES
    -- Khu A: 9 ô
    (1, 1, 'PLOT_A01', 1, 1, 10.0, 6.5, 75, 450000, 'AVAILABLE', NULL, NULL, NULL),
    (1, 2, 'PLOT_A02', 1, 2, 10.0, 6.4, 75, 450000, 'AVAILABLE', NULL, NULL, NULL),
    (1, 3, 'PLOT_A03', 1, 3, 10.0, 6.6, 70, 450000, 'AVAILABLE', NULL, NULL, NULL),
    (1, 4, 'PLOT_A04', 2, 1, 12.0, 6.5, 75, 520000, 'RESERVED', DATEADD(MINUTE, 14, SYSDATETIME()), 4, NULL), -- Đang giữ chỗ 15 phút
    (1, 5, 'PLOT_A05', 2, 2, 12.0, 6.3, 80, 520000, 'RENTED', NULL, NULL, NULL),                            -- Đang thuê
    (1, 6, 'PLOT_A06', 2, 3, 12.0, 6.5, 78, 520000, 'RENTED', NULL, NULL, NULL),                            -- Đang thuê (Vườn chuẩn bị thu hoạch của anh Tuấn)
    (1, 7, 'PLOT_A07', 3, 1, 15.0, 6.7, 72, 650000, 'RENTED', NULL, NULL, NULL),
    (1, 8, 'PLOT_A08', 3, 2, 15.0, 6.5, 70, 650000, 'FALLOWING', NULL, NULL, DATEADD(DAY, 3, SYSDATETIME())), -- Nghỉ đất & Cải tạo sau thu hoạch (BR-10)
    (1, 9, 'PLOT_A09', 3, 3, 15.0, 6.2, 65, 600000, 'MAINTENANCE', NULL, NULL, NULL),                         -- Bảo trì đường nước
    
    -- Khu B: 6 ô
    (2, 10, 'PLOT_B01', 1, 1, 20.0, 6.8, 65, 850000, 'AVAILABLE', NULL, NULL, NULL),
    (2, 11, 'PLOT_B02', 1, 2, 20.0, 6.7, 68, 850000, 'AVAILABLE', NULL, NULL, NULL),
    (2, 12, 'PLOT_B03', 1, 3, 20.0, 6.9, 70, 850000, 'RESERVED', DATEADD(MINUTE, 10, SYSDATETIME()), 4, NULL),
    (2, 13, 'PLOT_B04', 2, 1, 25.0, 6.8, 65, 1100000, 'RENTED', NULL, NULL, NULL),
    (2, 14, 'PLOT_B05', 2, 2, 25.0, 6.7, 68, 1100000, 'RENTED', NULL, NULL, NULL),
    (2, 15, 'PLOT_B06', 2, 3, 25.0, 6.8, 65, 1100000, 'FALLOWING', NULL, NULL, DATEADD(DAY, 4, SYSDATETIME()));
    PRINT N'Nạp 15 Ô đất với đủ 5 trạng thái thành công!';
END
GO

-- 7. NẠP HẠT GIỐNG & CÁC MỐC GIAI ĐOẠN PHÁT TRIỂN
IF NOT EXISTS (SELECT 1 FROM dbo.Seeds WHERE SeedName = N'Xà lách xoong Đà Lạt')
BEGIN
    INSERT INTO dbo.Seeds (SeedName, Category, GrowthDurationDays, MinRentalDays, ExpectedYieldKgPerM2, SuitableSoilType, Season, SeedPrice, ImageUrl, Description) VALUES
    (N'Xà lách xoong Đà Lạt', N'Rau ăn lá', 35, 42, 2.5, N'Đất đỏ bazan giàu mùn', N'Quanh năm', 45000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999', N'Rau giòn ngọt, giàu sắt và vitamin A/C. Chu kỳ 35 ngày thu hoạch.'),
    (N'Cải thìa baby thủy canh', N'Rau ăn lá', 30, 37, 3.0, N'Đất đỏ bazan giàu mùn', N'Quanh năm', 40000, 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57', N'Cải thìa ngọt mát, bẹ dày, thích hợp các món xào, luộc.'),
    (N'Cà chua bi Cherry F1', N'Rau củ quả', 75, 82, 4.5, N'Đất thịt pha cát tơi xốp', N'Vụ Đông Xuân', 65000, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea', N'Trái đỏ mọng, ngọt đậm đà, thu hoạch nhiều đợt kéo dài 30 ngày.'),
    (N'Dưa leo baby giòn ngọt', N'Rau củ quả', 45, 52, 5.0, N'Đất thịt pha cát tơi xốp', N'Quanh năm', 55000, 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6', N'Dưa leo baby năng suất cao, da bóng mỏng, ăn tươi thanh mát.'),
    (N'Rau muống hạt hữu cơ', N'Rau ăn lá', 25, 32, 3.5, N'Đất đỏ bazan giàu mùn', N'Quanh năm', 30000, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb', N'Rau muống cọng non xanh, lớn rất nhanh, dễ trồng.');
    PRINT N'Nạp 5 Giống cây thành công!';
END
GO

-- Nạp GrowthStages cho giống Xà lách xoong (SeedId = 1)
IF NOT EXISTS (SELECT 1 FROM dbo.GrowthStages WHERE SeedId = 1)
BEGIN
    INSERT INTO dbo.GrowthStages (SeedId, StageOrder, StageName, DurationDays, Description, SampleImageUrl) VALUES
    (1, 1, N'Chuẩn bị đất & Gieo hạt', 3, N'Bón lót vi sinh, san phẳng đất và gieo mầm', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae'),
    (1, 2, N'Nảy mầm & Cây con', 7, N'Hạt nứt nanh, nhú 2 lá mầm xanh non', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9'),
    (1, 3, N'Phát triển thân lá mạnh', 15, N'Tán lá xòe rộng, thân vươn cao, tưới đủ ẩm', 'https://images.unsplash.com/photo-1540420773420-3366772f4999'),
    (1, 4, N'Trưởng thành & Sẵn sàng thu hoạch', 10, N'Bẹ lá cuộn chắc, đạt độ giòn ngọt tối ưu', 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57');
    PRINT N'Nạp GrowthStages cho Xà lách xoong thành công!';
END
GO

-- 8. NẠP GÓI CHĂM SÓC
IF NOT EXISTS (SELECT 1 FROM dbo.CarePackages WHERE PackageName = N'Gói Cơ Bản (Basic Care)')
BEGIN
    INSERT INTO dbo.CarePackages (PackageName, MonthlyFee, Description, ServicesIncluded) VALUES
    (N'Gói Cơ Bản (Basic Care)', 250000, N'Chăm sóc tiêu chuẩn phù hợp người mới bắt đầu', N'Tưới nước tự động 2 lần/ngày; Chụp ảnh cập nhật nhật ký 1 lần/tuần; Nhổ cỏ định kỳ 10 ngày/lần.'),
    (N'Gói Hữu Cơ Nâng Cao (Organic Pro)', 450000, N'Chăm sóc chuyên sâu bằng chế phẩm sinh học organic', N'Tưới nước theo cảm biến ẩm độ; Bón phân trùn quế & đạm cá hữu cơ 1 tuần/lần; Cập nhật nhật ký ảnh/video 2 lần/tuần; Phun xua đuổi côn trùng bằng tinh dầu tỏi ớt thảo mộc.'),
    (N'Gói Toàn Diện (Green VIP)', 750000, N'Dịch vụ VIP chăm sóc như khu vườn riêng tại gia', N'Chăm sóc 1-1 chuyên biệt; Bón phân hữu cơ vi sinh cao cấp; Nhật ký ảnh HD mỗi 3 ngày; Hỗ trợ yêu cầu tưới phân bón theo chỉ định; Miễn phí công thu hoạch và đóng gói thùng xốp bảo quản lạnh.');
    PRINT N'Nạp 3 Gói chăm sóc thành công!';
END
GO

-- 9. NẠP ĐƠN THUÊ MẪU & VỤ TRỒNG SẴN SÀNG THU HOẠCH (Dành cho Anh Tuấn - Khách hàng demo)
IF NOT EXISTS (SELECT 1 FROM dbo.RentalOrders WHERE OrderCode = 'ORD_DEMO_2026_01')
BEGIN
    INSERT INTO dbo.RentalOrders (OrderCode, UserId, PlotId, SeedId, CarePackageId, DurationMonths, TotalRentalDays, StartDate, EndDate, RentalFee, SeedFee, CareFee, TotalAmount, Status, PaidAt) VALUES
    ('ORD_DEMO_2026_01', 5, 6, 1, 2, 2, 60, DATEADD(DAY, -35, CAST(SYSDATETIME() AS DATE)), DATEADD(DAY, 25, CAST(SYSDATETIME() AS DATE)), 1040000, 45000, 900000, 1985000, 'PAID', DATEADD(DAY, -35, SYSDATETIME()));

    -- Chi tiết đơn
    INSERT INTO dbo.OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice) VALUES
    (1, 'PLOT_RENTAL', N'Thuê Ô đất PLOT_A06 (2 tháng)', 2, 520000, 1040000),
    (1, 'SEED', N'Hạt giống Xà lách xoong Đà Lạt', 1, 45000, 45000),
    (1, 'CARE_PACKAGE', N'Gói Hữu Cơ Nâng Cao (2 tháng)', 2, 450000, 900000);

    -- Giao dịch thanh toán
    INSERT INTO dbo.Payments (OrderId, TransactionCode, PaymentMethod, Amount, Status) VALUES
    (1, 'TXN_VNPAY_998822', 'VNPAY', 1985000, 'SUCCESS');

    -- Khởi tạo Vụ trồng đạt độ chín READY_TO_HARVEST (phục vụ kịch bản demo nút Thu hoạch của Tuấn ngày 63)
    INSERT INTO dbo.Cultivations (OrderId, PlotId, SeedId, CurrentStageId, StartDate, ExpectedHarvestDate, ProgressPercent, Status) VALUES
    (1, 6, 1, 4, DATEADD(DAY, -35, CAST(SYSDATETIME() AS DATE)), CAST(SYSDATETIME() AS DATE), 100.0, 'READY_TO_HARVEST');

    -- Nhật ký canh tác thực tế
    INSERT INTO dbo.CultivationLogs (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus) VALUES
    (1, 2, DATEADD(DAY, -35, SYSDATETIME()), 'WEEDING', N'Làm đất và lên luống chuẩn bị gieo hạt', N'Đất đã được bổ sung phân hữu cơ vi sinh, đo độ pH đạt 6.5 lý tưởng.', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae', 'GOOD'),
    (1, 2, DATEADD(DAY, -28, SYSDATETIME()), 'INSPECTION', N'Cây nhú mầm đồng đều đạt 98%', N'Mầm cây phát triển mạnh, rễ bám đất tốt, bắt đầu tưới phun sương nhẹ.', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9', 'GOOD'),
    (1, 3, DATEADD(DAY, -14, SYSDATETIME()), 'FERTILIZING', N'Bón thúc đạm cá hữu cơ đợt 1', N'Tán lá xòe rộng, màu xanh mướt, không có hiện tượng sâu bệnh.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999', 'GOOD'),
    (1, 2, SYSDATETIME(), 'INSPECTION', N'Nghiệm thu: Rau đạt độ chín hoàn hảo!', N'Kỹ thuật viên kiểm tra: Cây cao 25cm, lá giòn đều, đạt tiêu chuẩn VietGAP sẵn sàng thu hoạch.', 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57', 'GOOD');

    -- Dữ liệu cảm biến IoT thời gian thực tại ô đất PLOT_A06
    INSERT INTO dbo.SensorData (PlotId, Temperature, AirHumidity, SoilMoisture, LightLux) VALUES
    (6, 22.5, 78, 74, 18500),
    (6, 23.0, 76, 72, 22000),
    (6, 21.8, 80, 75, 14000);

    -- Yêu cầu chăm sóc phát sinh đã xong
    INSERT INTO dbo.CareRequests (CultivationId, UserId, AssignedStaffId, ServiceType, CustomerNote, AdditionalFee, IsFeeAccepted, PaymentStatus, Status, ResultNote, ResultImageUrl, RequestedAt, CompletedAt) VALUES
    (1, 5, 2, N'Tưới nước bổ sung buổi trưa', N'Hôm nay trời nắng gắt, nhờ nhân viên tưới đẫm nước giúp tôi', 0, 1, 'FREE', 'COMPLETED', N'Đã phun sương hạ nhiệt cho luống rau 15 phút, cây rất tươi tỉnh.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999', DATEADD(DAY, -5, SYSDATETIME()), DATEADD(DAY, -5, DATEADD(HOUR, 2, SYSDATETIME())));

    -- Thông báo gửi đến anh Tuấn
    INSERT INTO dbo.Notifications (UserId, Title, Message, Type, RelatedId) VALUES
    (5, N'Rau của bạn đã sẵn sàng thu hoạch!', N'Vụ rau Xà lách xoong tại ô PLOT_A06 đã đạt độ chín chuẩn. Bạn có thể vào mục Vụ mùa để bấm "Yêu cầu thu hoạch" ngay bây giờ!', 'HARVEST', 1);

    PRINT N'Nạp dữ liệu đơn mẫu, vụ trồng sẵn sàng thu hoạch và IoT thành công!';
END
GO

PRINT N'==================================================================';
PRINT N'>>> NẠP THÀNH CÔNG TOÀN BỘ BỘ DỮ LIỆU MẪU CHUẨN CHO PLOTFARMDB!';
PRINT N'==================================================================';
GO
