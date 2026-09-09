-- ============================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC TRỰC TUYẾN (PLOTFARM / SMART FARM)
-- TÁC GIẢ: Trọng (Database Architect & Backend Leader)
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019+
-- PHIÊN BẢN: 2.0 (Tích hợp 13 Quy tắc nghiệp vụ BR-01 -> BR-13 & Chu kỳ FALLOWING)
-- ============================================================================

USE master;
GO

-- 1. Tạo mới Database nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PlotFarmDB')
BEGIN
    CREATE DATABASE PlotFarmDB COLLATE Vietnamese_CI_AS;
    PRINT N'>>> Đã khởi tạo thành công Database PlotFarmDB!';
END
ELSE
BEGIN
    PRINT N'>>> Database PlotFarmDB đã tồn tại. Sẵn sàng đồng bộ cấu trúc!';
END
GO

USE PlotFarmDB;
GO

-- ============================================================================
-- PHÂN HỆ 1: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (AUTH & USERS)
-- ============================================================================

-- Bảng Roles: Quản lý vai trò (Admin, Staff, Customer)
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,       -- 'Admin', 'Staff', 'Customer'
        Description NVARCHAR(255) NULL
    );
    PRINT N'Tạo bảng Roles thành công!';
END
GO

-- Bảng Users: Quản lý thông tin tài khoản người dùng
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        RoleId INT NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        PhoneNumber NVARCHAR(20) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOCKED', 'PENDING'
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
    );
    CREATE INDEX IX_Users_Email ON dbo.Users(Email);
    CREATE INDEX IX_Users_RoleId ON dbo.Users(RoleId);
    PRINT N'Tạo bảng Users thành công!';
END
GO

-- Bảng UserAddresses: Sổ địa chỉ nhận nông sản khi thu hoạch
IF OBJECT_ID('dbo.UserAddresses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserAddresses (
        AddressId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        RecipientName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20) NOT NULL,
        Province NVARCHAR(100) NOT NULL,
        District NVARCHAR(100) NOT NULL,
        Ward NVARCHAR(100) NOT NULL,
        AddressDetail NVARCHAR(255) NOT NULL,
        IsDefault BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE INDEX IX_UserAddresses_UserId ON dbo.UserAddresses(UserId);
    PRINT N'Tạo bảng UserAddresses thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 2: NÔNG TRẠI, Ô ĐẤT & THIẾT BỊ GIÁM SÁT IOT
-- ============================================================================

-- Bảng Farms: Thông tin trang trại
IF OBJECT_ID('dbo.Farms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Farms (
        FarmId INT IDENTITY(1,1) PRIMARY KEY,
        FarmName NVARCHAR(150) NOT NULL,
        Address NVARCHAR(255) NOT NULL,
        Hotline NVARCHAR(20) NOT NULL,
        TotalAreaM2 DECIMAL(10,2) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Latitude DECIMAL(10,7) NULL,
        Longitude DECIMAL(10,7) NULL,
        MaxDeliveryRadiusKm INT NOT NULL DEFAULT 30, -- Bán kính giao rau tươi tối đa (km)
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
    );
    PRINT N'Tạo bảng Farms thành công!';
END
GO

-- Bảng FarmAreas: Phân khu canh tác bên trong nông trại
IF OBJECT_ID('dbo.FarmAreas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FarmAreas (
        AreaId INT IDENTITY(1,1) PRIMARY KEY,
        FarmId INT NOT NULL,
        AreaCode NVARCHAR(50) NOT NULL UNIQUE,       -- 'AREA_A', 'AREA_B'
        AreaName NVARCHAR(100) NOT NULL,             -- 'Khu Rau Hữu Cơ A', 'Khu Củ Quả B'
        SoilType NVARCHAR(100) NOT NULL,             -- 'Đất phù sa', 'Đất thịt nhẹ', 'Đất đỏ bazan'
        TotalPlots INT NOT NULL DEFAULT 0,
        Description NVARCHAR(255) NULL,
        CONSTRAINT FK_FarmAreas_Farms FOREIGN KEY (FarmId) REFERENCES dbo.Farms(FarmId)
    );
    PRINT N'Tạo bảng FarmAreas thành công!';
END
GO

-- Bảng Cameras: Thiết bị camera giám sát gắn tại ô đất / khu vực
IF OBJECT_ID('dbo.Cameras', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cameras (
        CameraId INT IDENTITY(1,1) PRIMARY KEY,
        CameraCode NVARCHAR(50) NOT NULL UNIQUE,     -- 'CAM_P01', 'CAM_P02'
        CameraName NVARCHAR(100) NOT NULL,
        StreamUrl NVARCHAR(500) NOT NULL,            -- RTSP / HLS hoặc mp4 mô phỏng video
        TimelapseUrl NVARCHAR(500) NULL,             -- Video mô phỏng time-lapse cây lớn
        Status NVARCHAR(30) NOT NULL DEFAULT 'ONLINE'-- 'ONLINE', 'OFFLINE', 'MAINTENANCE'
    );
    PRINT N'Tạo bảng Cameras thành công!';
END
GO

-- Bảng Plots: Thông tin chi tiết ô đất canh tác
-- Áp dụng BR-01, BR-10 (FALLOWING), BR-11 (RESERVED timeout 15 phút)
IF OBJECT_ID('dbo.Plots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Plots (
        PlotId INT IDENTITY(1,1) PRIMARY KEY,
        AreaId INT NOT NULL,
        CameraId INT NULL,
        PlotCode NVARCHAR(50) NOT NULL UNIQUE,       -- 'PLOT_A01', 'PLOT_A02'
        RowNum INT NOT NULL,
        ColNum INT NOT NULL,
        SizeM2 DECIMAL(6,2) NOT NULL DEFAULT 10.0,   -- Diện tích (m2)
        SoilPH DECIMAL(3,1) NOT NULL DEFAULT 6.5,    -- Độ pH đất
        StandardHumidity INT NOT NULL DEFAULT 70,    -- Độ ẩm tiêu chuẩn (%)
        BasePricePerMonth DECIMAL(12,2) NOT NULL,    -- Giá thuê ô đất mỗi tháng (VND)
        Status NVARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', 
        -- Ràng buộc 5 trạng thái chuẩn:
        -- 'AVAILABLE'   : Còn trống, sẵn sàng cho thuê (BR-01)
        -- 'RESERVED'    : Đang giữ chỗ 15 phút (BR-11)
        -- 'RENTED'      : Đang có hợp đồng canh tác (BR-02)
        -- 'FALLOWING'   : Đang nghỉ & cải tạo đất sau thu hoạch tối thiểu 3 ngày (BR-10)
        -- 'MAINTENANCE' : Đang bảo trì hạ tầng
        ReservedUntil DATETIME2(0) NULL,             -- Thời hạn hết hạn giữ chỗ (15 phút)
        ReservedByUserId INT NULL,                   -- Khách hàng đang giữ chỗ
        FallowingUntil DATETIME2(0) NULL,            -- Thời hạn kết thúc cải tạo đất (BR-10)
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT FK_Plots_FarmAreas FOREIGN KEY (AreaId) REFERENCES dbo.FarmAreas(AreaId),
        CONSTRAINT FK_Plots_Cameras FOREIGN KEY (CameraId) REFERENCES dbo.Cameras(CameraId),
        CONSTRAINT CK_Plots_Status CHECK (Status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'FALLOWING', 'MAINTENANCE'))
    );
    CREATE INDEX IX_Plots_AreaId ON dbo.Plots(AreaId);
    CREATE INDEX IX_Plots_Status ON dbo.Plots(Status);
    PRINT N'Tạo bảng Plots thành công!';
END
GO

-- Bảng SensorData: Dữ liệu cảm biến môi trường IoT mô phỏng
IF OBJECT_ID('dbo.SensorData', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SensorData (
        SensorDataId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PlotId INT NOT NULL,
        Temperature DECIMAL(4,1) NOT NULL,           -- Nhiệt độ không khí (°C)
        AirHumidity INT NOT NULL,                    -- Độ ẩm không khí (%)
        SoilMoisture INT NOT NULL,                   -- Độ ẩm đất (%)
        LightLux INT NULL,                           -- Cường độ ánh sáng (Lux)
        RecordedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_SensorData_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId) ON DELETE CASCADE
    );
    CREATE INDEX IX_SensorData_PlotId_RecordedAt ON dbo.SensorData(PlotId, RecordedAt DESC);
    PRINT N'Tạo bảng SensorData thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 3: HẠT GIỐNG & GÓI CHĂM SÓC
-- ============================================================================

-- Bảng Seeds: Danh mục hạt giống cây trồng
-- Áp dụng BR-09: Thêm MinRentalDays
IF OBJECT_ID('dbo.Seeds', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Seeds (
        SeedId INT IDENTITY(1,1) PRIMARY KEY,
        SeedName NVARCHAR(100) NOT NULL,             -- 'Xà lách xoong', 'Cà chua bi', 'Dưa leo baby'
        Category NVARCHAR(50) NOT NULL,              -- 'Rau ăn lá', 'Rau củ quả', 'Cây gia vị'
        GrowthDurationDays INT NOT NULL,             -- Số ngày lớn chuẩn (ví dụ: 35 ngày, 75 ngày)
        MinRentalDays INT NOT NULL,                  -- Thời gian thuê tối thiểu (GrowthDurationDays + 7 ngày đệm - BR-09)
        ExpectedYieldKgPerM2 DECIMAL(5,2) NOT NULL,  -- Sản lượng dự kiến / m2 (kg)
        SuitableSoilType NVARCHAR(100) NOT NULL,     -- Loại đất phù hợp
        Season NVARCHAR(50) NOT NULL,                -- 'Quanh năm', 'Vụ Đông Xuân', 'Vụ Hè Thu'
        SeedPrice DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Tiền hạt giống (VND)
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        IsAvailable BIT NOT NULL DEFAULT 1           -- Trạng thái còn giống
    );
    PRINT N'Tạo bảng Seeds thành công!';
END
GO

-- Bảng GrowthStages: Các mốc giai đoạn phát triển của từng loại cây
IF OBJECT_ID('dbo.GrowthStages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GrowthStages (
        StageId INT IDENTITY(1,1) PRIMARY KEY,
        SeedId INT NOT NULL,
        StageOrder INT NOT NULL,                     -- Thứ tự giai đoạn (1, 2, 3...)
        StageName NVARCHAR(100) NOT NULL,            -- 'Chuẩn bị đất', 'Gieo hạt & Nảy mầm', 'Phát triển lá', 'Cây chín'
        DurationDays INT NOT NULL,                   -- Số ngày diễn ra giai đoạn này
        Description NVARCHAR(500) NULL,
        SampleImageUrl NVARCHAR(500) NULL,
        CONSTRAINT FK_GrowthStages_Seeds FOREIGN KEY (SeedId) REFERENCES dbo.Seeds(SeedId) ON DELETE CASCADE
    );
    CREATE INDEX IX_GrowthStages_SeedId ON dbo.GrowthStages(SeedId);
    PRINT N'Tạo bảng GrowthStages thành công!';
END
GO

-- Bảng CarePackages: Các gói dịch vụ chăm sóc chuẩn
IF OBJECT_ID('dbo.CarePackages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CarePackages (
        PackageId INT IDENTITY(1,1) PRIMARY KEY,
        PackageName NVARCHAR(100) NOT NULL,          -- 'Gói Cơ Bản', 'Gói Hữu Cơ Nâng Cao', 'Gói Toàn Diện'
        MonthlyFee DECIMAL(12,2) NOT NULL,           -- Chi phí chăm sóc hàng tháng (VND)
        Description NVARCHAR(500) NULL,
        ServicesIncluded NVARCHAR(MAX) NOT NULL,     -- Chi tiết các công việc: tưới 2 lần/ngày, bón phân 1 lần/tuần...
        IsActive BIT NOT NULL DEFAULT 1
    );
    PRINT N'Tạo bảng CarePackages thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 4: ĐƠN THUÊ ĐẤT & THANH TOÁN
-- ============================================================================

-- Bảng RentalOrders: Quản lý đơn thuê đất
IF OBJECT_ID('dbo.RentalOrders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RentalOrders (
        OrderId INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode NVARCHAR(50) NOT NULL UNIQUE,      -- 'ORD_20260904_001'
        UserId INT NOT NULL,
        PlotId INT NOT NULL,
        SeedId INT NOT NULL,
        CarePackageId INT NOT NULL,
        DurationMonths INT NOT NULL DEFAULT 1,       -- Số tháng thuê
        TotalRentalDays INT NOT NULL,                -- Tổng số ngày thuê thực tế
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        RentalFee DECIMAL(12,2) NOT NULL,            -- Tiền thuê ô đất
        SeedFee DECIMAL(12,2) NOT NULL,              -- Tiền mua hạt giống
        CareFee DECIMAL(12,2) NOT NULL,              -- Tiền gói chăm sóc
        DiscountAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(12,2) NOT NULL,          -- Tổng tiền phải thanh toán
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
        -- 'PENDING_PAYMENT' : Chờ thanh toán (trong 15 phút)
        -- 'PAID'            : Đã thanh toán thành công (BR-03)
        -- 'CANCELLED'       : Đã hủy
        -- 'COMPLETED'       : Đã hoàn tất vụ mùa
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        PaidAt DATETIME2(0) NULL,
        CONSTRAINT FK_RentalOrders_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_RentalOrders_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId),
        CONSTRAINT FK_RentalOrders_Seeds FOREIGN KEY (SeedId) REFERENCES dbo.Seeds(SeedId),
        CONSTRAINT FK_RentalOrders_CarePackages FOREIGN KEY (CarePackageId) REFERENCES dbo.CarePackages(PackageId),
        CONSTRAINT CK_RentalOrders_Status CHECK (Status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED'))
    );
    CREATE INDEX IX_RentalOrders_UserId ON dbo.RentalOrders(UserId);
    CREATE INDEX IX_RentalOrders_PlotId ON dbo.RentalOrders(PlotId);
    CREATE INDEX IX_RentalOrders_Status ON dbo.RentalOrders(Status);
    PRINT N'Tạo bảng RentalOrders thành công!';
END
GO

-- Bảng OrderDetails: Chi tiết các thành phần chi phí trong đơn thuê
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderDetails (
        DetailId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ItemType NVARCHAR(50) NOT NULL,              -- 'PLOT_RENTAL', 'SEED', 'CARE_PACKAGE', 'DISCOUNT'
        ItemName NVARCHAR(150) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(12,2) NOT NULL,
        TotalPrice DECIMAL(12,2) NOT NULL,
        CONSTRAINT FK_OrderDetails_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId) ON DELETE CASCADE
    );
    PRINT N'Tạo bảng OrderDetails thành công!';
END
GO

-- Bảng Payments: Lưu trữ thông tin giao dịch thanh toán trực tuyến
IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        TransactionCode NVARCHAR(100) NOT NULL UNIQUE,
        PaymentMethod NVARCHAR(50) NOT NULL,         -- 'MOMO', 'VNPAY', 'BANKING', 'SANDBOX'
        Amount DECIMAL(12,2) NOT NULL,
        PaymentDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        Status NVARCHAR(30) NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'PENDING'
        GatewayResponse NVARCHAR(MAX) NULL,
        CONSTRAINT FK_Payments_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId)
    );
    CREATE INDEX IX_Payments_OrderId ON dbo.Payments(OrderId);
    PRINT N'Tạo bảng Payments thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 5: QUẢN LÝ VỤ TRỒNG (CULTIVATION) & NHẬT KÝ SỐ
-- ============================================================================

-- Bảng Cultivations: Vòng đời vụ trồng trên ô đất
-- Áp dụng BR-02 (duy nhất 1 vụ active / plot), BR-05 (tiến độ dự kiến), BR-13 (FAILED rủi ro)
IF OBJECT_ID('dbo.Cultivations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cultivations (
        CultivationId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL UNIQUE,                 -- Quan hệ 1-1 với RentalOrder
        PlotId INT NOT NULL,
        SeedId INT NOT NULL,
        CurrentStageId INT NULL,
        StartDate DATE NOT NULL,
        ExpectedHarvestDate DATE NOT NULL,
        ActualHarvestDate DATE NULL,
        ProgressPercent DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- Tiến độ toán học dự kiến (BR-05)
        Status NVARCHAR(30) NOT NULL DEFAULT 'PLANTING',
        -- 'PLANTING'          : Đang làm đất & gieo hạt
        -- 'GROWING'           : Đang sinh trưởng
        -- 'READY_TO_HARVEST'  : Nhân viên xác nhận cây chín, mở nút thu hoạch (BR-06)
        -- 'HARVESTED'         : Đã thu hoạch xong
        -- 'FAILED'            : Cây chết do thiên tai / dịch bệnh (BR-13)
        DamageReason NVARCHAR(500) NULL,             -- Lý do thiệt hại vụ mùa nếu có (BR-13)
        ReplantCount INT NOT NULL DEFAULT 0,         -- Số lần gieo trồng lại miễn phí theo bảo hiểm
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT FK_Cultivations_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId),
        CONSTRAINT FK_Cultivations_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId),
        CONSTRAINT FK_Cultivations_Seeds FOREIGN KEY (SeedId) REFERENCES dbo.Seeds(SeedId),
        CONSTRAINT FK_Cultivations_GrowthStages FOREIGN KEY (CurrentStageId) REFERENCES dbo.GrowthStages(StageId),
        CONSTRAINT CK_Cultivations_Status CHECK (Status IN ('PLANTING', 'GROWING', 'READY_TO_HARVEST', 'HARVESTED', 'FAILED'))
    );
    CREATE INDEX IX_Cultivations_PlotId ON dbo.Cultivations(PlotId);
    CREATE INDEX IX_Cultivations_Status ON dbo.Cultivations(Status);
    PRINT N'Tạo bảng Cultivations thành công!';
END
GO

-- Bảng CultivationLogs: Nhật ký canh tác số của nhân viên
IF OBJECT_ID('dbo.CultivationLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CultivationLogs (
        LogId INT IDENTITY(1,1) PRIMARY KEY,
        CultivationId INT NOT NULL,
        StaffId INT NOT NULL,                        -- Nhân viên phụ trách đăng nhật ký
        LogDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        ActivityType NVARCHAR(50) NOT NULL,          -- 'WATERING', 'FERTILIZING', 'PEST_CONTROL', 'WEEDING', 'INSPECTION'
        Title NVARCHAR(150) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        ImageUrl NVARCHAR(500) NULL,
        VideoUrl NVARCHAR(500) NULL,
        PlantHealthStatus NVARCHAR(50) NOT NULL DEFAULT 'GOOD', -- 'GOOD', 'NEED_CARE', 'DAMAGED'
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_CultivationLogs_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId) ON DELETE CASCADE,
        CONSTRAINT FK_CultivationLogs_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId)
    );
    CREATE INDEX IX_CultivationLogs_CultivationId ON dbo.CultivationLogs(CultivationId);
    PRINT N'Tạo bảng CultivationLogs thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 6: YÊU CẦU CHĂM SÓC & PHÂN CÔNG NHÂN VIÊN
-- ============================================================================

-- Bảng CareRequests: Yêu cầu chăm sóc phát sinh từ khách hàng
-- Áp dụng BR-07, BR-12: Báo giá phụ phí và duyệt phí trước khi thực hiện
IF OBJECT_ID('dbo.CareRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareRequests (
        RequestId INT IDENTITY(1,1) PRIMARY KEY,
        CultivationId INT NOT NULL,
        UserId INT NOT NULL,                         -- Khách hàng tạo yêu cầu
        AssignedStaffId INT NULL,                    -- Kỹ thuật viên được giao việc
        ServiceType NVARCHAR(100) NOT NULL,          -- 'Tưới thêm nước', 'Bón phân hữu cơ vi sinh', 'Chụp ảnh chi tiết'
        CustomerNote NVARCHAR(500) NULL,
        AdditionalFee DECIMAL(12,2) NOT NULL DEFAULT 0, -- Phụ phí báo giá (BR-12)
        IsFeeAccepted BIT NOT NULL DEFAULT 1,        -- Khách hàng duyệt biểu phí (BR-12)
        PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'PAID', -- 'UNPAID', 'PAID', 'FREE'
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        -- 'PENDING'     : Mới gửi, chờ nhân viên báo giá/tiếp nhận
        -- 'AWAITING_FEE': Chờ khách hàng duyệt báo giá và thanh toán phụ phí
        -- 'IN_PROGRESS' : Đang xử lý
        -- 'COMPLETED'   : Đã hoàn thành
        -- 'REJECTED'    : Từ chối yêu cầu
        ResultNote NVARCHAR(500) NULL,               -- Báo cáo kết quả của nhân viên
        ResultImageUrl NVARCHAR(500) NULL,           -- Ảnh chụp nghiệm thu
        RequestedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CompletedAt DATETIME2(0) NULL,
        CONSTRAINT FK_CareRequests_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId),
        CONSTRAINT FK_CareRequests_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_CareRequests_Staff FOREIGN KEY (AssignedStaffId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_CareRequests_Status CHECK (Status IN ('PENDING', 'AWAITING_FEE', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))
    );
    CREATE INDEX IX_CareRequests_CultivationId ON dbo.CareRequests(CultivationId);
    CREATE INDEX IX_CareRequests_Status ON dbo.CareRequests(Status);
    PRINT N'Tạo bảng CareRequests thành công!';
END
GO

-- Bảng StaffAssignments: Phân công nhân viên phụ trách khu vực / ô đất
IF OBJECT_ID('dbo.StaffAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StaffAssignments (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        StaffId INT NOT NULL,
        AreaId INT NOT NULL,
        Shift NVARCHAR(50) NOT NULL DEFAULT 'MORNING', -- 'MORNING', 'AFTERNOON', 'FULL_DAY'
        AssignedDate DATE NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
        Notes NVARCHAR(255) NULL,
        CONSTRAINT FK_StaffAssignments_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_StaffAssignments_FarmAreas FOREIGN KEY (AreaId) REFERENCES dbo.FarmAreas(AreaId)
    );
    PRINT N'Tạo bảng StaffAssignments thành công!';
END
GO

-- ============================================================================
-- PHÂN HỆ 7: THU HOẠCH, GIAO NHẬN & THÔNG BÁO
-- ============================================================================

-- Bảng HarvestRequests: Quản lý yêu cầu thu hoạch của khách hàng
-- Áp dụng BR-06: Chỉ tạo khi vụ mùa đạt READY_TO_HARVEST
IF OBJECT_ID('dbo.HarvestRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HarvestRequests (
        HarvestRequestId INT IDENTITY(1,1) PRIMARY KEY,
        CultivationId INT NOT NULL,
        UserId INT NOT NULL,
        HarvestType NVARCHAR(50) NOT NULL,           -- 'RECEIVE_AT_FARM' (Tại vườn) hoặc 'HOME_DELIVERY' (Giao tận nhà)
        RequestDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        Status NVARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
        -- 'REQUESTED'   : Khách gửi yêu cầu thu hoạch
        -- 'PROCESSING'  : Nhân viên đang cắt hái & đóng gói
        -- 'COMPLETED'   : Đã thu hoạch xong
        -- 'CANCELLED'   : Đã hủy
        CustomerNote NVARCHAR(500) NULL,
        CONSTRAINT FK_HarvestRequests_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId),
        CONSTRAINT FK_HarvestRequests_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_HarvestRequests_Status CHECK (Status IN ('REQUESTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'))
    );
    CREATE INDEX IX_HarvestRequests_CultivationId ON dbo.HarvestRequests(CultivationId);
    PRINT N'Tạo bảng HarvestRequests thành công!';
END
GO

-- Bảng HarvestResults: Lưu trữ kết quả sản lượng thực tế sau thu hoạch
IF OBJECT_ID('dbo.HarvestResults', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HarvestResults (
        ResultId INT IDENTITY(1,1) PRIMARY KEY,
        HarvestRequestId INT NOT NULL UNIQUE,
        StaffId INT NOT NULL,                        -- Kỹ thuật viên nghiệm thu
        ActualYieldKg DECIMAL(6,2) NOT NULL,         -- Sản lượng thực tế (kg)
        QualityGrade NVARCHAR(50) NOT NULL DEFAULT 'GRADE_A', -- 'GRADE_A' (Đạt chuẩn), 'GRADE_B', 'GRADE_C'
        HarvestDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        InspectionNote NVARCHAR(500) NULL,
        ProductImageUrl NVARCHAR(500) NULL,
        CONSTRAINT FK_HarvestResults_HarvestRequests FOREIGN KEY (HarvestRequestId) REFERENCES dbo.HarvestRequests(HarvestRequestId),
        CONSTRAINT FK_HarvestResults_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId)
    );
    PRINT N'Tạo bảng HarvestResults thành công!';
END
GO

-- Bảng Deliveries: Vận chuyển nông sản về tận nhà
IF OBJECT_ID('dbo.Deliveries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deliveries (
        DeliveryId INT IDENTITY(1,1) PRIMARY KEY,
        HarvestRequestId INT NOT NULL UNIQUE,
        RecipientName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20) NOT NULL,
        DeliveryAddress NVARCHAR(255) NOT NULL,
        CarrierName NVARCHAR(100) NOT NULL DEFAULT N'Nông trại giao hỏa tốc',
        TrackingCode NVARCHAR(100) NULL,
        ShippingFee DECIMAL(12,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL DEFAULT 'PACKING',
        -- 'PACKING'     : Đang đóng thùng xốp & bảo quản mát
        -- 'SHIPPING'    : Đang trên đường vận chuyển
        -- 'DELIVERED'   : Đã giao tận tay khách
        -- 'FAILED'      : Giao thất bại
        ShippedAt DATETIME2(0) NULL,
        DeliveredAt DATETIME2(0) NULL,
        ProofImageUrl NVARCHAR(500) NULL,            -- Ảnh chụp ký nhận
        CONSTRAINT FK_Deliveries_HarvestRequests FOREIGN KEY (HarvestRequestId) REFERENCES dbo.HarvestRequests(HarvestRequestId),
        CONSTRAINT CK_Deliveries_Status CHECK (Status IN ('PACKING', 'SHIPPING', 'DELIVERED', 'FAILED'))
    );
    PRINT N'Tạo bảng Deliveries thành công!';
END
GO

-- Bảng Notifications: Thông báo trong hệ thống
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(150) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'GENERAL',-- 'ORDER', 'JOURNAL', 'CARE', 'HARVEST', 'ALERT'
        RelatedId INT NULL,                          -- Id của đối tượng liên quan (CultivationId, OrderId...)
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications(UserId, IsRead);
    PRINT N'Tạo bảng Notifications thành công!';
END
GO

PRINT N'==================================================================';
PRINT N'>>> HOÀN TẤT TẠO TOÀN BỘ 21 BẢNG CHUẨN TRONG CSDL PLOTFARMDB!';
PRINT N'==================================================================';
GO
