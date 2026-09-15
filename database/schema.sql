-- =====================================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC NÔNG TRẠI THÔNG MINH (PLOTFARM)
-- DATABASE MASTER SCRIPT: PlotFarmDB
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019+
-- TÁC GIẢ: Âu Lương Thành Trọng (Leader / Database Architect) & PlotFarm Team 4
-- LƯU Ý: ĐÂY LÀ FILE DUY NHẤT ĐỂ KHỞI TẠO VÀ CẬP NHẬT TOÀN BỘ CSDL CHO HỆ THỐNG.
--       MỌI BẢNG, RÀNG BUỘC, CHỈ MỤC HOẶC MIGRATION MỚI SAU NÀY SẼ BỔ SUNG TRỰC TIẾP VÀO ĐÂY.
-- =====================================================================================

USE master;
GO

-- =====================================================================================
-- 0. KHỞI TẠO DATABASE
-- =====================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'PlotFarmDB')
BEGIN
    CREATE DATABASE PlotFarmDB COLLATE Vietnamese_CI_AS;
    PRINT N'[KHỞI TẠO] Đã tạo mới CSDL PlotFarmDB thành công.';
END
ELSE
BEGIN
    PRINT N'[THÔNG TIN] CSDL PlotFarmDB đã tồn tại.';
END
GO

USE PlotFarmDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO

PRINT N'-------------------------------------------------------------------------';
PRINT N'BẮT ĐẦU ĐỒNG BỘ CSDL PLOTFARM (MASTER SCHEMA SCRIPT)...';
PRINT N'-------------------------------------------------------------------------';

-- =====================================================================================
-- 1. BẢNG dbo.Roles (Vai trò người dùng trong hệ thống)
-- =====================================================================================
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId INT IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_RoleName UNIQUE,
        Description NVARCHAR(255) NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSDATETIME()
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Roles.';
END
ELSE
BEGIN
    PRINT N'[THÔNG TIN] Bảng dbo.Roles đã tồn tại.';
END
GO

-- Dữ liệu mẫu (Seed Roles)
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Admin')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Admin', N'Quản trị viên toàn quyền hệ thống');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Staff')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Staff', N'Kỹ thuật viên nông trại chăm sóc và đăng nhật ký');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Customer')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Customer', N'Khách hàng thuê đất và theo dõi mùa vụ');
GO

-- =====================================================================================
-- 2. BẢNG dbo.Users (Tài khoản người dùng)
-- =====================================================================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
        RoleId INT NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        PhoneNumber NVARCHAR(20) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Users_Status DEFAULT 'ACTIVE',
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,

        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) 
            REFERENCES dbo.Roles(RoleId) 
            ON DELETE NO ACTION 
            ON UPDATE CASCADE,

        CONSTRAINT CK_Users_Status CHECK (Status IN ('ACTIVE', 'LOCKED', 'PENDING')),
        CONSTRAINT CK_Users_Email CHECK (Email LIKE '%@%.%')
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Users.';
END
ELSE
BEGIN
    PRINT N'[THÔNG TIN] Bảng dbo.Users đã tồn tại. Đang kiểm tra cấu trúc...';

    IF COL_LENGTH('dbo.Users', 'PhoneNumber') IS NULL
        ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

    IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
        ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(500) NULL;

    IF COL_LENGTH('dbo.Users', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.Users ADD UpdatedAt DATETIME2(0) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Email 
    ON dbo.Users(Email) 
    INCLUDE (UserId, RoleId, PasswordHash, FullName, Status);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_Users_Email.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_RoleId' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_RoleId 
    ON dbo.Users(RoleId);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_Users_RoleId.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Status' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Status 
    ON dbo.Users(Status);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_Users_Status.';
END
GO

-- =====================================================================================
-- 3. BẢNG dbo.UserAddresses (Sổ địa chỉ nhận rau củ thu hoạch)
-- =====================================================================================
IF OBJECT_ID('dbo.UserAddresses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserAddresses (
        AddressId INT IDENTITY(1,1) NOT NULL,
        UserId INT NOT NULL,
        RecipientName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20) NOT NULL,
        AddressLine NVARCHAR(255) NOT NULL CONSTRAINT DF_UserAddresses_AddressLine DEFAULT '',
        Label NVARCHAR(100) NULL,
        StreetAddress NVARCHAR(255) NULL,
        Ward NVARCHAR(100) NOT NULL,
        District NVARCHAR(100) NULL,
        Province NVARCHAR(100) NOT NULL,
        IsDefault BIT NOT NULL CONSTRAINT DF_UserAddresses_IsDefault DEFAULT 0,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_UserAddresses_CreatedAt DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT PK_UserAddresses PRIMARY KEY CLUSTERED (AddressId ASC),
        CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId) ON DELETE CASCADE
    );
    PRINT N'[THÀNH CÔNG] Đã tạo mới bảng dbo.UserAddresses với PK, FK và Default Constraints.';
END
ELSE
BEGIN
    PRINT N'[THÔNG TIN] Bảng dbo.UserAddresses đã tồn tại. Đang kiểm tra và chuẩn hóa cấu trúc...';

    IF COL_LENGTH('dbo.UserAddresses', 'AddressLine') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD AddressLine NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
            EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = AddressDetail WHERE AddressLine IS NULL;');
        IF COL_LENGTH('dbo.UserAddresses', 'StreetAddress') IS NOT NULL
            EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = StreetAddress WHERE AddressLine IS NULL;');
        EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = N'''' WHERE AddressLine IS NULL;');
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressLine NVARCHAR(255) NOT NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung và chuẩn hóa cột AddressLine NVARCHAR(255) NOT NULL.';
    END

    IF COL_LENGTH('dbo.UserAddresses', 'Label') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD Label NVARCHAR(100) NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung cột Label NVARCHAR(100) NULL.';
    END

    IF COL_LENGTH('dbo.UserAddresses', 'StreetAddress') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD StreetAddress NVARCHAR(255) NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung cột StreetAddress NVARCHAR(255) NULL.';
    END

    EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = StreetAddress WHERE (AddressLine IS NULL OR AddressLine = N'''') AND StreetAddress IS NOT NULL;');

    IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressDetail NVARCHAR(255) NULL;

    IF COL_LENGTH('dbo.UserAddresses', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.UserAddresses ADD UpdatedAt DATETIME2(0) NULL;

    ALTER TABLE dbo.UserAddresses ALTER COLUMN District NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_UserAddresses_Users' AND parent_object_id = OBJECT_ID('dbo.UserAddresses'))
        ALTER TABLE dbo.UserAddresses WITH CHECK ADD CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId) ON DELETE CASCADE;

    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'IsDefault')
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_IsDefault DEFAULT 0 FOR IsDefault;

    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'CreatedAt')
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_CreatedAt DEFAULT SYSDATETIME() FOR CreatedAt;

    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'AddressLine')
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_AddressLine DEFAULT '' FOR AddressLine;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserAddresses_UserId' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserAddresses_UserId 
    ON dbo.UserAddresses (UserId ASC, IsDefault DESC, AddressId DESC);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_UserAddresses_UserId tối ưu hóa truy vấn sổ địa chỉ.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAddresses_Default' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_UserAddresses_Default 
    ON dbo.UserAddresses (UserId) 
    WHERE IsDefault = 1;
    PRINT N'[THÀNH CÔNG] Đã tạo Filtered Unique Index UX_UserAddresses_Default.';
END;
GO

-- =====================================================================================
-- 4. PHÂN HỆ NÔNG TRẠI, Ô ĐẤT & THIẾT BỊ GIÁM SÁT IOT
-- =====================================================================================

-- 4.1 BẢNG dbo.Farms (Thông tin trang trại)
IF OBJECT_ID('dbo.Farms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Farms (
        FarmId INT IDENTITY(1,1) CONSTRAINT PK_Farms PRIMARY KEY,
        FarmName NVARCHAR(150) NOT NULL,
        Address NVARCHAR(255) NOT NULL,
        Hotline NVARCHAR(20) NOT NULL,
        TotalAreaM2 DECIMAL(10,2) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Latitude DECIMAL(10,7) NULL,
        Longitude DECIMAL(10,7) NULL,
        MaxDeliveryRadiusKm INT NOT NULL DEFAULT 30,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Farms_CreatedAt DEFAULT SYSDATETIME()
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Farms.';
END
GO

-- 4.2 BẢNG dbo.FarmAreas (Phân khu canh tác)
IF OBJECT_ID('dbo.FarmAreas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FarmAreas (
        AreaId INT IDENTITY(1,1) CONSTRAINT PK_FarmAreas PRIMARY KEY,
        FarmId INT NOT NULL,
        AreaCode NVARCHAR(50) NOT NULL CONSTRAINT UQ_FarmAreas_AreaCode UNIQUE,
        AreaName NVARCHAR(100) NOT NULL,
        SoilType NVARCHAR(100) NOT NULL,
        TotalPlots INT NOT NULL DEFAULT 20,
        Description NVARCHAR(255) NULL,
        CONSTRAINT FK_FarmAreas_Farms FOREIGN KEY (FarmId) REFERENCES dbo.Farms(FarmId)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.FarmAreas.';
END
GO

-- 4.3 BẢNG dbo.Cameras (Thiết bị camera giám sát ô đất)
IF OBJECT_ID('dbo.Cameras', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cameras (
        CameraId INT IDENTITY(1,1) CONSTRAINT PK_Cameras PRIMARY KEY,
        CameraCode NVARCHAR(50) NOT NULL CONSTRAINT UQ_Cameras_CameraCode UNIQUE,
        CameraName NVARCHAR(100) NOT NULL,
        StreamUrl NVARCHAR(500) NOT NULL,
        TimelapseUrl NVARCHAR(500) NULL,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Cameras_Status DEFAULT 'ONLINE'
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Cameras.';
END
GO

-- 4.4 BẢNG dbo.Plots (Thông tin chi tiết ô đất canh tác)
IF OBJECT_ID('dbo.Plots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Plots (
        PlotId INT IDENTITY(1,1) CONSTRAINT PK_Plots PRIMARY KEY,
        AreaId INT NOT NULL,
        CameraId INT NULL,
        PlotCode NVARCHAR(50) NOT NULL CONSTRAINT UQ_Plots_PlotCode UNIQUE,
        RowNum INT NOT NULL,
        ColNum INT NOT NULL,
        SizeM2 DECIMAL(6,2) NOT NULL DEFAULT 15.0,
        SoilPH DECIMAL(3,1) NOT NULL DEFAULT 6.5,
        StandardHumidity INT NOT NULL DEFAULT 75,
        BasePricePerMonth DECIMAL(12,2) NOT NULL DEFAULT 500000.0,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Plots_Status DEFAULT 'AVAILABLE',
        ReservedUntil DATETIME2(0) NULL,
        ReservedByUserId INT NULL,
        FallowingUntil DATETIME2(0) NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Plots_CreatedAt DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT FK_Plots_FarmAreas FOREIGN KEY (AreaId) REFERENCES dbo.FarmAreas(AreaId),
        CONSTRAINT FK_Plots_Cameras FOREIGN KEY (CameraId) REFERENCES dbo.Cameras(CameraId),
        CONSTRAINT FK_Plots_Users FOREIGN KEY (ReservedByUserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Plots_Status CHECK (Status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'FALLOWING', 'MAINTENANCE'))
    );
    CREATE INDEX IX_Plots_AreaId ON dbo.Plots(AreaId);
    CREATE INDEX IX_Plots_Status ON dbo.Plots(Status);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Plots.';
END
GO

-- 4.5 BẢNG dbo.SensorData (Dữ liệu cảm biến môi trường IoT)
IF OBJECT_ID('dbo.SensorData', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SensorData (
        SensorDataId BIGINT IDENTITY(1,1) CONSTRAINT PK_SensorData PRIMARY KEY,
        PlotId INT NOT NULL,
        Temperature DECIMAL(4,1) NOT NULL,
        AirHumidity INT NOT NULL,
        SoilMoisture INT NOT NULL,
        LightLux INT NULL,
        RecordedAt DATETIME2(0) NOT NULL CONSTRAINT DF_SensorData_RecordedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_SensorData_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId) ON DELETE CASCADE
    );
    CREATE INDEX IX_SensorData_PlotId_RecordedAt ON dbo.SensorData(PlotId, RecordedAt DESC);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.SensorData.';
END
GO

-- =====================================================================================
-- 5. PHÂN HỆ HẠT GIỐNG & GÓI CHĂM SÓC
-- =====================================================================================

-- 5.1 BẢNG dbo.Seeds (Danh mục hạt giống cây trồng)
IF OBJECT_ID('dbo.Seeds', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Seeds (
        SeedId INT IDENTITY(1,1) CONSTRAINT PK_Seeds PRIMARY KEY,
        SeedName NVARCHAR(100) NOT NULL,
        Category NVARCHAR(50) NOT NULL,
        GrowthDurationDays INT NOT NULL,
        MinRentalDays INT NOT NULL CONSTRAINT DF_Seeds_MinRentalDays DEFAULT 30,
        ExpectedYieldKgPerM2 DECIMAL(5,2) NOT NULL CONSTRAINT DF_Seeds_ExpectedYield DEFAULT 3.0,
        SuitableSoilType NVARCHAR(100) NOT NULL,
        Season NVARCHAR(50) NOT NULL,
        SeedPrice DECIMAL(12,2) NOT NULL CONSTRAINT DF_Seeds_SeedPrice DEFAULT 0,
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        IsAvailable BIT NOT NULL CONSTRAINT DF_Seeds_IsAvailable DEFAULT 1
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Seeds.';
END
GO

-- 5.2 BẢNG dbo.GrowthStages (Các giai đoạn phát triển cây)
IF OBJECT_ID('dbo.GrowthStages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GrowthStages (
        StageId INT IDENTITY(1,1) CONSTRAINT PK_GrowthStages PRIMARY KEY,
        SeedId INT NOT NULL,
        StageOrder INT NOT NULL,
        StageName NVARCHAR(100) NOT NULL,
        DurationDays INT NOT NULL,
        Description NVARCHAR(500) NULL,
        SampleImageUrl NVARCHAR(500) NULL,
        CONSTRAINT FK_GrowthStages_Seeds FOREIGN KEY (SeedId) REFERENCES dbo.Seeds(SeedId) ON DELETE CASCADE
    );
    CREATE INDEX IX_GrowthStages_SeedId ON dbo.GrowthStages(SeedId);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.GrowthStages.';
END
GO

-- 5.3 BẢNG dbo.CarePackages (Gói dịch vụ chăm sóc)
IF OBJECT_ID('dbo.CarePackages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CarePackages (
        PackageId INT IDENTITY(1,1) CONSTRAINT PK_CarePackages PRIMARY KEY,
        PackageName NVARCHAR(100) NOT NULL,
        MonthlyFee DECIMAL(12,2) NOT NULL CONSTRAINT DF_CarePackages_MonthlyFee DEFAULT 0,
        Description NVARCHAR(500) NULL,
        ServicesIncluded NVARCHAR(MAX) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CarePackages_IsActive DEFAULT 1
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.CarePackages.';
END
GO

-- =====================================================================================
-- 6. PHÂN HỆ ĐƠN THUÊ ĐẤT, THANH TOÁN & CANH TÁC
-- =====================================================================================

-- 6.1 BẢNG dbo.RentalOrders (Đơn thuê ô đất)
IF OBJECT_ID('dbo.RentalOrders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RentalOrders (
        OrderId INT IDENTITY(1,1) CONSTRAINT PK_RentalOrders PRIMARY KEY,
        OrderCode NVARCHAR(50) NOT NULL CONSTRAINT UQ_RentalOrders_OrderCode UNIQUE,
        UserId INT NOT NULL,
        PlotId INT NOT NULL,
        SeedId INT NOT NULL,
        CarePackageId INT NOT NULL,
        DurationMonths INT NOT NULL DEFAULT 1,
        TotalRentalDays INT NOT NULL DEFAULT 30,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        RentalFee DECIMAL(12,2) NOT NULL,
        SeedFee DECIMAL(12,2) NOT NULL,
        CareFee DECIMAL(12,2) NOT NULL,
        DiscountAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(12,2) NOT NULL,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_RentalOrders_Status DEFAULT 'PENDING_PAYMENT',
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_RentalOrders_CreatedAt DEFAULT SYSDATETIME(),
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
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.RentalOrders.';
END
GO

-- 6.2 BẢNG dbo.OrderDetails (Chi tiết đơn thuê)
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderDetails (
        DetailId INT IDENTITY(1,1) CONSTRAINT PK_OrderDetails PRIMARY KEY,
        OrderId INT NOT NULL,
        ItemType NVARCHAR(50) NOT NULL,
        ItemName NVARCHAR(150) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(12,2) NOT NULL,
        TotalPrice DECIMAL(12,2) NOT NULL,
        CONSTRAINT FK_OrderDetails_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId) ON DELETE CASCADE
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.OrderDetails.';
END
GO

-- 6.3 BẢNG dbo.Payments (Giao dịch thanh toán)
IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId INT IDENTITY(1,1) CONSTRAINT PK_Payments PRIMARY KEY,
        OrderId INT NOT NULL,
        TransactionCode NVARCHAR(50) NOT NULL CONSTRAINT UQ_Payments_TransactionCode UNIQUE,
        PaymentMethod NVARCHAR(30) NOT NULL,
        Amount DECIMAL(12,2) NOT NULL,
        PaymentDate DATETIME2(0) NOT NULL CONSTRAINT DF_Payments_PaymentDate DEFAULT SYSDATETIME(),
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Payments_Status DEFAULT 'SUCCESS',
        GatewayResponse NVARCHAR(MAX) NULL,
        CONSTRAINT FK_Payments_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Payments.';
END
GO

-- 6.4 BẢNG dbo.Cultivations (Vụ mùa canh tác)
IF OBJECT_ID('dbo.Cultivations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cultivations (
        CultivationId INT IDENTITY(1,1) CONSTRAINT PK_Cultivations PRIMARY KEY,
        OrderId INT NOT NULL,
        PlotId INT NOT NULL,
        SeedId INT NOT NULL,
        CurrentStageId INT NULL,
        StartDate DATE NOT NULL,
        ExpectedHarvestDate DATE NOT NULL,
        ActualHarvestDate DATE NULL,
        ProgressPercent DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        ReplantCount INT NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Cultivations_Status DEFAULT 'PLANTING',
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Cultivations_CreatedAt DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(0) NULL,
        CONSTRAINT FK_Cultivations_RentalOrders FOREIGN KEY (OrderId) REFERENCES dbo.RentalOrders(OrderId),
        CONSTRAINT FK_Cultivations_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId),
        CONSTRAINT FK_Cultivations_Seeds FOREIGN KEY (SeedId) REFERENCES dbo.Seeds(SeedId),
        CONSTRAINT FK_Cultivations_GrowthStages FOREIGN KEY (CurrentStageId) REFERENCES dbo.GrowthStages(StageId),
        CONSTRAINT CK_Cultivations_Status CHECK (Status IN ('PLANTING', 'GROWING', 'READY_TO_HARVEST', 'HARVESTED', 'FAILED'))
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Cultivations.';
END
GO

-- 6.5 BẢNG dbo.CultivationLogs (Nhật ký canh tác hình ảnh/video)
IF OBJECT_ID('dbo.CultivationLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CultivationLogs (
        LogId INT IDENTITY(1,1) CONSTRAINT PK_CultivationLogs PRIMARY KEY,
        CultivationId INT NOT NULL,
        StaffId INT NOT NULL,
        LogDate DATETIME2(0) NOT NULL CONSTRAINT DF_CultivationLogs_LogDate DEFAULT SYSDATETIME(),
        ActivityType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(150) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        ImageUrl NVARCHAR(500) NULL,
        PlantHealthStatus NVARCHAR(30) NOT NULL CONSTRAINT DF_CultivationLogs_Health DEFAULT 'GOOD',
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_CultivationLogs_CreatedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_CultivationLogs_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId) ON DELETE CASCADE,
        CONSTRAINT FK_CultivationLogs_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.CultivationLogs.';
END
GO

-- 6.6 BẢNG dbo.CareRequests (Yêu cầu chăm sóc bổ sung)
IF OBJECT_ID('dbo.CareRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareRequests (
        RequestId INT IDENTITY(1,1) CONSTRAINT PK_CareRequests PRIMARY KEY,
        CultivationId INT NOT NULL,
        UserId INT NOT NULL,
        AssignedStaffId INT NULL,
        ServiceType NVARCHAR(100) NOT NULL,
        CustomerNote NVARCHAR(500) NULL,
        AdditionalFee DECIMAL(12,2) NOT NULL DEFAULT 0,
        IsFeeAccepted BIT NOT NULL DEFAULT 1,
        PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'PAID',
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_CareRequests_Status DEFAULT 'PENDING',
        ResultNote NVARCHAR(500) NULL,
        ResultImageUrl NVARCHAR(500) NULL,
        RequestedAt DATETIME2(0) NOT NULL CONSTRAINT DF_CareRequests_RequestedAt DEFAULT SYSDATETIME(),
        CompletedAt DATETIME2(0) NULL,
        CONSTRAINT FK_CareRequests_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId),
        CONSTRAINT FK_CareRequests_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_CareRequests_Staff FOREIGN KEY (AssignedStaffId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_CareRequests_Status CHECK (Status IN ('PENDING', 'AWAITING_FEE', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))
    );
    CREATE INDEX IX_CareRequests_CultivationId ON dbo.CareRequests(CultivationId);
    CREATE INDEX IX_CareRequests_Status ON dbo.CareRequests(Status);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.CareRequests.';
END
GO

-- 6.7 BẢNG dbo.StaffAssignments (Phân công nhân viên)
IF OBJECT_ID('dbo.StaffAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StaffAssignments (
        AssignmentId INT IDENTITY(1,1) CONSTRAINT PK_StaffAssignments PRIMARY KEY,
        StaffId INT NOT NULL,
        AreaId INT NOT NULL,
        PlotId INT NULL,
        Shift NVARCHAR(50) NOT NULL CONSTRAINT DF_StaffAssignments_Shift DEFAULT N'SÁNG',
        AssignedDate DATE NOT NULL CONSTRAINT DF_StaffAssignments_AssignedDate DEFAULT CAST(SYSDATETIME() AS DATE),
        AssignedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StaffAssignments_AssignedAt DEFAULT SYSDATETIME(),
        Notes NVARCHAR(255) NULL,
        CONSTRAINT FK_StaffAssignments_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_StaffAssignments_FarmAreas FOREIGN KEY (AreaId) REFERENCES dbo.FarmAreas(AreaId),
        CONSTRAINT FK_StaffAssignments_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.StaffAssignments.';
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.StaffAssignments', 'PlotId') IS NULL
    BEGIN
        ALTER TABLE dbo.StaffAssignments ADD PlotId INT NULL;
        ALTER TABLE dbo.StaffAssignments ADD CONSTRAINT FK_StaffAssignments_Plots FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId);
    END;
    IF COL_LENGTH('dbo.StaffAssignments', 'AssignedAt') IS NULL
    BEGIN
        ALTER TABLE dbo.StaffAssignments ADD AssignedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StaffAssignments_AssignedAt DEFAULT SYSDATETIME();
    END;
END
GO

-- 6.8 BẢNG dbo.HarvestRequests (Yêu cầu thu hoạch)
IF OBJECT_ID('dbo.HarvestRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HarvestRequests (
        HarvestRequestId INT IDENTITY(1,1) CONSTRAINT PK_HarvestRequests PRIMARY KEY,
        CultivationId INT NOT NULL,
        UserId INT NOT NULL,
        HarvestType NVARCHAR(50) NOT NULL,
        RequestDate DATETIME2(0) NOT NULL CONSTRAINT DF_HarvestRequests_RequestDate DEFAULT SYSDATETIME(),
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_HarvestRequests_Status DEFAULT 'REQUESTED',
        CustomerNote NVARCHAR(500) NULL,
        CONSTRAINT FK_HarvestRequests_Cultivations FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId),
        CONSTRAINT FK_HarvestRequests_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_HarvestRequests_Status CHECK (Status IN ('REQUESTED', 'PROCESSING', 'HARVESTED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'))
    );
    CREATE INDEX IX_HarvestRequests_CultivationId ON dbo.HarvestRequests(CultivationId);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.HarvestRequests.';
END
GO

-- 6.9 BẢNG dbo.HarvestResults (Kết quả thu hoạch nghiệm thu)
IF OBJECT_ID('dbo.HarvestResults', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HarvestResults (
        ResultId INT IDENTITY(1,1) CONSTRAINT PK_HarvestResults PRIMARY KEY,
        HarvestRequestId INT NOT NULL CONSTRAINT UQ_HarvestResults_RequestId UNIQUE,
        StaffId INT NOT NULL,
        ActualYieldKg DECIMAL(6,2) NOT NULL,
        QualityGrade NVARCHAR(50) NOT NULL CONSTRAINT DF_HarvestResults_Grade DEFAULT 'GRADE_A',
        HarvestDate DATETIME2(0) NOT NULL CONSTRAINT DF_HarvestResults_Date DEFAULT SYSDATETIME(),
        InspectionNote NVARCHAR(500) NULL,
        ProductImageUrl NVARCHAR(500) NULL,
        CONSTRAINT FK_HarvestResults_HarvestRequests FOREIGN KEY (HarvestRequestId) REFERENCES dbo.HarvestRequests(HarvestRequestId),
        CONSTRAINT FK_HarvestResults_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.HarvestResults.';
END
GO

-- 6.10 BẢNG dbo.Deliveries (Vận chuyển giao rau tận nhà)
IF OBJECT_ID('dbo.Deliveries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deliveries (
        DeliveryId INT IDENTITY(1,1) CONSTRAINT PK_Deliveries PRIMARY KEY,
        HarvestRequestId INT NOT NULL CONSTRAINT UQ_Deliveries_RequestId UNIQUE,
        RecipientName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20) NOT NULL,
        DeliveryAddress NVARCHAR(255) NOT NULL,
        CarrierName NVARCHAR(100) NOT NULL DEFAULT N'Nông trại giao hỏa tốc',
        TrackingCode NVARCHAR(100) NULL,
        ShippingFee DECIMAL(12,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Deliveries_Status DEFAULT 'PACKING',
        ShippedAt DATETIME2(0) NULL,
        DeliveredAt DATETIME2(0) NULL,
        ProofImageUrl NVARCHAR(500) NULL,
        CONSTRAINT FK_Deliveries_HarvestRequests FOREIGN KEY (HarvestRequestId) REFERENCES dbo.HarvestRequests(HarvestRequestId),
        CONSTRAINT CK_Deliveries_Status CHECK (Status IN ('PACKING', 'SHIPPING', 'DELIVERED', 'FAILED'))
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Deliveries.';
END
GO

-- 6.11 BẢNG dbo.Notifications (Hệ thống thông báo)
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationId INT IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(150) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        Type NVARCHAR(50) NOT NULL CONSTRAINT DF_Notifications_Type DEFAULT 'GENERAL',
        RelatedId INT NULL,
        IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications(UserId, IsRead);
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.Notifications.';
END
GO

-- =====================================================================================
-- 7. BẢNG dbo.CareSchedules (Lịch trình chăm sóc dự kiến — Tự động sinh theo mùa vụ)
-- =====================================================================================
IF OBJECT_ID('dbo.CareSchedules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareSchedules (
        CareScheduleId  INT IDENTITY(1,1) CONSTRAINT PK_CareSchedules PRIMARY KEY,
        CultivationId   INT NOT NULL,
        PackageId       INT NULL,
        ActivityType    NVARCHAR(50)  NOT NULL,
        ScheduledDate   DATE          NOT NULL,
        Notes           NVARCHAR(255) NULL,
        Status          NVARCHAR(30)  NOT NULL CONSTRAINT DF_CareSchedules_Status DEFAULT 'PENDING',
        AssignedStaffId INT NULL,
        CompletedAt     DATETIME2(0)  NULL,
        ResultNote      NVARCHAR(500) NULL,
        ResultImageUrl  NVARCHAR(500) NULL,
        CreatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_CareSchedules_CreatedAt DEFAULT SYSDATETIME(),

        CONSTRAINT FK_CareSchedules_Cultivations FOREIGN KEY (CultivationId)
            REFERENCES dbo.Cultivations(CultivationId) ON DELETE CASCADE,
        CONSTRAINT FK_CareSchedules_Staff FOREIGN KEY (AssignedStaffId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT CK_CareSchedules_Status CHECK (Status IN ('PENDING','COMPLETED','SKIPPED')),
        CONSTRAINT CK_CareSchedules_ActivityType CHECK (ActivityType IN ('WATERING','FERTILIZING','PRUNING','PEST_CONTROL','SOIL_TEST'))
    );
    PRINT N'[THÀNH CÔNG] Đã tạo bảng dbo.CareSchedules.';
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.CareSchedules', 'ResultImageUrl') IS NULL
        ALTER TABLE dbo.CareSchedules ADD ResultImageUrl NVARCHAR(500) NULL;
    IF COL_LENGTH('dbo.CareSchedules', 'ResultNote') IS NULL
        ALTER TABLE dbo.CareSchedules ADD ResultNote NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareSchedules_Cultivation_Date'
               AND object_id = OBJECT_ID('dbo.CareSchedules'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CareSchedules_Cultivation_Date
    ON dbo.CareSchedules (CultivationId ASC, ScheduledDate ASC)
    INCLUDE (ActivityType, Status, AssignedStaffId, Notes);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CareSchedules_Cultivation_Date.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareSchedules_Date_Status'
               AND object_id = OBJECT_ID('dbo.CareSchedules'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CareSchedules_Date_Status
    ON dbo.CareSchedules (ScheduledDate ASC, Status ASC)
    INCLUDE (CultivationId, ActivityType, AssignedStaffId);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CareSchedules_Date_Status.';
END
GO

-- =====================================================================================
-- 8. TỐI ƯU HÓA HIỆU NĂNG — COMPOSITE & COVERING INDEXES
-- =====================================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RentalOrders_UserId_Status_Created'
               AND object_id = OBJECT_ID('dbo.RentalOrders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RentalOrders_UserId_Status_Created
    ON dbo.RentalOrders (UserId ASC, Status ASC, CreatedAt DESC)
    INCLUDE (OrderCode, PlotId, SeedId, CarePackageId, TotalAmount, PaidAt,
             DurationMonths, TotalRentalDays, StartDate, EndDate,
             RentalFee, SeedFee, CareFee, DiscountAmount);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_RentalOrders_UserId_Status_Created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Cultivations_PlotId_Status'
               AND object_id = OBJECT_ID('dbo.Cultivations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Cultivations_PlotId_Status
    ON dbo.Cultivations (PlotId ASC, Status ASC)
    INCLUDE (CultivationId, OrderId, SeedId, StartDate, ExpectedHarvestDate, ProgressPercent);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_Cultivations_PlotId_Status.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareRequests_Staff_Status'
               AND object_id = OBJECT_ID('dbo.CareRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CareRequests_Staff_Status
    ON dbo.CareRequests (AssignedStaffId ASC, Status ASC)
    INCLUDE (RequestId, CultivationId, ServiceType, CustomerNote, RequestedAt, CompletedAt);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CareRequests_Staff_Status.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HarvestRequests_Status_Date'
               AND object_id = OBJECT_ID('dbo.HarvestRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HarvestRequests_Status_Date
    ON dbo.HarvestRequests (Status ASC, RequestDate DESC)
    INCLUDE (HarvestRequestId, CultivationId, UserId, HarvestType, CustomerNote);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_HarvestRequests_Status_Date.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CultivationLogs_CultivationId_LogDate'
               AND object_id = OBJECT_ID('dbo.CultivationLogs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CultivationLogs_CultivationId_LogDate
    ON dbo.CultivationLogs (CultivationId ASC, LogDate DESC)
    INCLUDE (LogId, StaffId, ActivityType, Title, PlantHealthStatus, ImageUrl, CreatedAt);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CultivationLogs_CultivationId_LogDate.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Deliveries_Status_ShippedAt'
               AND object_id = OBJECT_ID('dbo.Deliveries'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Deliveries_Status_ShippedAt
    ON dbo.Deliveries (Status ASC, ShippedAt DESC)
    INCLUDE (DeliveryId, HarvestRequestId, RecipientName, TrackingCode, CarrierName, DeliveredAt);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_Deliveries_Status_ShippedAt.';
END
GO

-- =====================================================================================
-- 9. STORED PROCEDURES — XUẤT DỮ LIỆU TỐI ƯU HÓA
-- =====================================================================================

IF OBJECT_ID('dbo.sp_ExportOrderHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ExportOrderHistory;
GO

CREATE PROCEDURE dbo.sp_ExportOrderHistory
    @UserId        INT           = NULL,
    @Status        NVARCHAR(30)  = NULL,
    @FromDate      DATE          = NULL,
    @ToDate        DATE          = NULL,
    @PageNumber    INT           = 1,
    @PageSize      INT           = 20,
    @TotalCount    INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET ARITHABORT ON;

    IF @PageSize > 100 SET @PageSize = 100;
    IF @PageNumber < 1  SET @PageNumber = 1;

    SELECT @TotalCount = COUNT(*)
    FROM dbo.RentalOrders ro WITH (NOLOCK)
    WHERE (@UserId IS NULL OR ro.UserId = @UserId)
      AND (@Status IS NULL OR ro.Status = @Status)
      AND (@FromDate IS NULL OR CAST(ro.CreatedAt AS DATE) >= @FromDate)
      AND (@ToDate   IS NULL OR CAST(ro.CreatedAt AS DATE) <= @ToDate);

    SELECT
        ro.OrderId, ro.OrderCode, ro.UserId,
        u.FullName    AS CustomerName,
        u.Email       AS CustomerEmail,
        u.PhoneNumber AS CustomerPhone,
        p.PlotCode,   p.SizeM2,
        s.SeedName,
        cp.PackageName,
        ro.TotalRentalDays, ro.DurationMonths,
        ro.StartDate, ro.EndDate,
        ro.RentalFee, ro.SeedFee, ro.CareFee,
        ro.DiscountAmount, ro.TotalAmount,
        ro.Status     AS OrderStatus,
        ro.CreatedAt, ro.PaidAt
    FROM dbo.RentalOrders ro WITH (NOLOCK)
    INNER JOIN dbo.Users   u  WITH (NOLOCK) ON ro.UserId       = u.UserId
    INNER JOIN dbo.Plots   p  WITH (NOLOCK) ON ro.PlotId       = p.PlotId
    INNER JOIN dbo.Seeds   s  WITH (NOLOCK) ON ro.SeedId       = s.SeedId
    LEFT  JOIN dbo.CarePackages cp WITH (NOLOCK) ON ro.CarePackageId = cp.PackageId
    WHERE (@UserId IS NULL OR ro.UserId = @UserId)
      AND (@Status IS NULL OR ro.Status = @Status)
      AND (@FromDate IS NULL OR CAST(ro.CreatedAt AS DATE) >= @FromDate)
      AND (@ToDate   IS NULL OR CAST(ro.CreatedAt AS DATE) <= @ToDate)
    ORDER BY ro.CreatedAt DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

PRINT N'[THÀNH CÔNG] Đã tạo Stored Procedure dbo.sp_ExportOrderHistory.';
GO

IF OBJECT_ID('dbo.sp_ExportCultivationHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ExportCultivationHistory;
GO

CREATE PROCEDURE dbo.sp_ExportCultivationHistory
    @UserId        INT           = NULL,
    @PlotId        INT           = NULL,
    @Status        NVARCHAR(30)  = NULL,
    @FromDate      DATE          = NULL,
    @ToDate        DATE          = NULL,
    @PageNumber    INT           = 1,
    @PageSize      INT           = 20,
    @TotalCount    INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET ARITHABORT ON;

    IF @PageSize > 100 SET @PageSize = 100;
    IF @PageNumber < 1  SET @PageNumber = 1;

    SELECT @TotalCount = COUNT(*)
    FROM dbo.Cultivations c WITH (NOLOCK)
    INNER JOIN dbo.RentalOrders ro WITH (NOLOCK) ON c.OrderId = ro.OrderId
    WHERE (@UserId  IS NULL OR ro.UserId  = @UserId)
      AND (@PlotId  IS NULL OR c.PlotId   = @PlotId)
      AND (@Status  IS NULL OR c.Status   = @Status)
      AND (@FromDate IS NULL OR c.StartDate >= @FromDate)
      AND (@ToDate   IS NULL OR c.StartDate <= @ToDate);

    SELECT
        c.CultivationId, c.Status AS CultivationStatus,
        c.StartDate, c.ExpectedHarvestDate, c.ActualHarvestDate,
        c.ProgressPercent, c.ReplantCount,
        ro.OrderCode, ro.TotalAmount,
        p.PlotCode, p.SizeM2, p.SoilPH,
        fa.AreaName,
        s.SeedName, s.Category AS SeedCategory,
        s.GrowthDurationDays, s.ExpectedYieldKgPerM2,
        u.FullName  AS CustomerName,
        u.Email     AS CustomerEmail,
        cp.PackageName,
        (SELECT COUNT(*) FROM dbo.CultivationLogs cl WITH (NOLOCK)
         WHERE cl.CultivationId = c.CultivationId)                     AS TotalLogCount,
        (SELECT COUNT(*) FROM dbo.CareRequests cr WITH (NOLOCK)
         WHERE cr.CultivationId = c.CultivationId AND cr.Status = 'COMPLETED') AS CompletedCareRequests,
        (SELECT COUNT(*) FROM dbo.CareSchedules cs WITH (NOLOCK)
         WHERE cs.CultivationId = c.CultivationId AND cs.Status = 'COMPLETED') AS CompletedSchedules,
        (SELECT COUNT(*) FROM dbo.CareSchedules cs WITH (NOLOCK)
         WHERE cs.CultivationId = c.CultivationId)                     AS TotalSchedules
    FROM dbo.Cultivations c WITH (NOLOCK)
    INNER JOIN dbo.RentalOrders ro WITH (NOLOCK) ON c.OrderId    = ro.OrderId
    INNER JOIN dbo.Users        u  WITH (NOLOCK) ON ro.UserId    = u.UserId
    INNER JOIN dbo.Plots        p  WITH (NOLOCK) ON c.PlotId     = p.PlotId
    LEFT  JOIN dbo.FarmAreas    fa WITH (NOLOCK) ON p.AreaId     = fa.AreaId
    INNER JOIN dbo.Seeds        s  WITH (NOLOCK) ON c.SeedId     = s.SeedId
    LEFT  JOIN dbo.CarePackages cp WITH (NOLOCK) ON ro.CarePackageId = cp.PackageId
    WHERE (@UserId  IS NULL OR ro.UserId  = @UserId)
      AND (@PlotId  IS NULL OR c.PlotId   = @PlotId)
      AND (@Status  IS NULL OR c.Status   = @Status)
      AND (@FromDate IS NULL OR c.StartDate >= @FromDate)
      AND (@ToDate   IS NULL OR c.StartDate <= @ToDate)
    ORDER BY c.StartDate DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

PRINT N'[THÀNH CÔNG] Đã tạo Stored Procedure dbo.sp_ExportCultivationHistory.';
GO

-- =====================================================================================
-- 10. TỔNG KẾT KIỂM TRA SCHEMA CSDL
-- =====================================================================================
PRINT N'-------------------------------------------------------------------------';
PRINT N'HOÀN TẤT ĐỒNG BỘ TOÀN BỘ CSDL PLOTFARM THÀNH CÔNG 100%!';
PRINT N'-------------------------------------------------------------------------';

SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    ISNULL(i.is_primary_key, 0) AS IsPrimaryKey
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.index_columns ic ON ic.object_id = t.object_id AND ic.column_id = c.column_id
LEFT JOIN sys.indexes i ON i.object_id = t.object_id AND i.index_id = ic.index_id AND i.is_primary_key = 1
WHERE t.name IN (
    'Roles', 'Users', 'UserAddresses', 'Farms', 'FarmAreas', 'Cameras',
    'Plots', 'SensorData', 'Seeds', 'GrowthStages', 'CarePackages',
    'RentalOrders', 'OrderDetails', 'Payments', 'Cultivations',
    'CultivationLogs', 'CareRequests', 'StaffAssignments', 'HarvestRequests',
    'HarvestResults', 'Deliveries', 'Notifications', 'CareSchedules'
)
ORDER BY t.name, c.column_id;
GO
