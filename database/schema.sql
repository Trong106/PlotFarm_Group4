-- =====================================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC NÔNG TRẠI THÔNG MINH (PLOTFARM)
-- DATABASE MASTER SCRIPT: PlotFarmDB
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019+
-- TÁC GIẢ: Âu Lương Thành Trọng (Leader / Database Architect) - PlotFarm Team 4
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

        -- Khóa ngoại tham chiếu bảng Roles
        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) 
            REFERENCES dbo.Roles(RoleId) 
            ON DELETE NO ACTION 
            ON UPDATE CASCADE,

        -- Ràng buộc giá trị hợp lệ cho Status
        CONSTRAINT CK_Users_Status CHECK (Status IN ('ACTIVE', 'LOCKED', 'PENDING')),

        -- Ràng buộc định dạng Email cơ bản
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

-- Chỉ mục cho bảng Users
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

    -- 3.1 Kiểm tra và bổ sung cột AddressLine
    IF COL_LENGTH('dbo.UserAddresses', 'AddressLine') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD AddressLine NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
        BEGIN
            EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = AddressDetail WHERE AddressLine IS NULL;');
        END
        IF COL_LENGTH('dbo.UserAddresses', 'StreetAddress') IS NOT NULL
        BEGIN
            EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = StreetAddress WHERE AddressLine IS NULL;');
        END
        EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = N'''' WHERE AddressLine IS NULL;');
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressLine NVARCHAR(255) NOT NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung và chuẩn hóa cột AddressLine NVARCHAR(255) NOT NULL.';
    END

    -- 3.2 Bổ sung cột Label và StreetAddress hỗ trợ dữ liệu seed
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

    -- Đồng bộ StreetAddress sang AddressLine nếu AddressLine rỗng
    EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = StreetAddress WHERE (AddressLine IS NULL OR AddressLine = N'''') AND StreetAddress IS NOT NULL;');

    -- 3.3 Cho phép AddressDetail NULL nếu bảng cũ tồn tại cột này
    IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressDetail NVARCHAR(255) NULL;
    END

    -- 3.4 Kiểm tra và bổ sung cột UpdatedAt
    IF COL_LENGTH('dbo.UserAddresses', 'UpdatedAt') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD UpdatedAt DATETIME2(0) NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung cột UpdatedAt DATETIME2(0) NULL.';
    END

    -- 3.5 Chuẩn hóa cột District cho phép NULL
    ALTER TABLE dbo.UserAddresses ALTER COLUMN District NVARCHAR(100) NULL;

    -- 3.6 Kiểm tra và bổ sung khóa ngoại FK_UserAddresses_Users
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_UserAddresses_Users' AND parent_object_id = OBJECT_ID('dbo.UserAddresses'))
    BEGIN
        ALTER TABLE dbo.UserAddresses WITH CHECK ADD CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users (UserId) ON DELETE CASCADE;
        PRINT N'[CẬP NHẬT] Đã tạo khóa ngoại FK_UserAddresses_Users liên kết tới Users(UserId).';
    END

    -- 3.7 Kiểm tra và bổ sung Default Constraint cho IsDefault
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'IsDefault')
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_IsDefault DEFAULT 0 FOR IsDefault;
        PRINT N'[CẬP NHẬT] Đã tạo ràng buộc mặc định DF_UserAddresses_IsDefault (DEFAULT 0).';
    END

    -- 3.8 Kiểm tra và bổ sung Default Constraint cho CreatedAt
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'CreatedAt')
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_CreatedAt DEFAULT SYSDATETIME() FOR CreatedAt;
        PRINT N'[CẬP NHẬT] Đã tạo ràng buộc mặc định DF_UserAddresses_CreatedAt (DEFAULT SYSDATETIME()).';
    END

    -- 3.9 Default constraint cho AddressLine
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'AddressLine')
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_AddressLine DEFAULT '' FOR AddressLine;
    END
END;
GO

-- 3.10 Chỉ mục tìm kiếm theo UserId (Index tối ưu hóa truy vấn sổ địa chỉ người dùng)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserAddresses_UserId' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserAddresses_UserId 
    ON dbo.UserAddresses (UserId ASC, IsDefault DESC, AddressId DESC);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_UserAddresses_UserId tối ưu hóa truy vấn sổ địa chỉ.';
END;
GO

-- 3.11 Chỉ mục duy nhất có điều kiện (Filtered Unique Index):
-- Nghiệp vụ cốt lõi: Mỗi người dùng (UserId) chỉ được phép có TỐI ĐA 1 địa chỉ nhận rau mặc định (IsDefault = 1)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAddresses_Default' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_UserAddresses_Default 
    ON dbo.UserAddresses (UserId) 
    WHERE IsDefault = 1;
    PRINT N'[THÀNH CÔNG] Đã tạo Filtered Unique Index UX_UserAddresses_Default (Đảm bảo duy nhất 1 địa chỉ mặc định/user).';
END;
GO

-- =====================================================================================
-- 4. BẢNG dbo.CareSchedules (Lịch trình chăm sóc dự kiến — Tự động sinh theo mùa vụ)
-- =====================================================================================
IF OBJECT_ID('dbo.CareSchedules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareSchedules (
        CareScheduleId  INT IDENTITY(1,1) CONSTRAINT PK_CareSchedules PRIMARY KEY,
        CultivationId   INT NOT NULL,
        PackageId       INT NULL,
        ActivityType    NVARCHAR(50)  NOT NULL,   -- 'WATERING','FERTILIZING','PRUNING'
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
    -- Bổ sung cột ResultImageUrl nếu thiếu (migration-safe)
    IF COL_LENGTH('dbo.CareSchedules', 'ResultImageUrl') IS NULL
        ALTER TABLE dbo.CareSchedules ADD ResultImageUrl NVARCHAR(500) NULL;
    IF COL_LENGTH('dbo.CareSchedules', 'ResultNote') IS NULL
        ALTER TABLE dbo.CareSchedules ADD ResultNote NVARCHAR(500) NULL;
    PRINT N'[THÔNG TIN] Bảng dbo.CareSchedules đã tồn tại.';
END
GO

-- Index: Tìm lịch theo CultivationId + ngày (Staff Portal dashboard)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareSchedules_Cultivation_Date'
               AND object_id = OBJECT_ID('dbo.CareSchedules'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CareSchedules_Cultivation_Date
    ON dbo.CareSchedules (CultivationId ASC, ScheduledDate ASC)
    INCLUDE (ActivityType, Status, AssignedStaffId, Notes);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CareSchedules_Cultivation_Date.';
END
GO

-- Index: Tìm lịch theo ngày + trạng thái (Staff xem lịch hôm nay)
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
-- 5. TỐI ƯU HÓA HIỆU NĂNG — COMPOSITE & COVERING INDEXES
-- =====================================================================================

-- [P1] RentalOrders: Tăng tốc getMyOrders (UserId + Status + phân trang)
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

-- [P2] Cultivations: Tăng tốc truy vấn ô đất theo trạng thái
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Cultivations_PlotId_Status'
               AND object_id = OBJECT_ID('dbo.Cultivations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Cultivations_PlotId_Status
    ON dbo.Cultivations (PlotId ASC, Status ASC)
    INCLUDE (CultivationId, OrderId, SeedId, StartDate, ExpectedHarvestDate, ProgressPercent);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_Cultivations_PlotId_Status.';
END
GO

-- [P3] CareRequests: Tăng tốc Staff Portal — lọc theo nhân viên + trạng thái
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareRequests_Staff_Status'
               AND object_id = OBJECT_ID('dbo.CareRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CareRequests_Staff_Status
    ON dbo.CareRequests (AssignedStaffId ASC, Status ASC)
    INCLUDE (RequestId, CultivationId, ServiceType, CustomerNote, RequestedAt, CompletedAt);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CareRequests_Staff_Status.';
END
GO

-- [P4] HarvestRequests: Tăng tốc xuất đơn thu hoạch theo trạng thái + ngày
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HarvestRequests_Status_Date'
               AND object_id = OBJECT_ID('dbo.HarvestRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HarvestRequests_Status_Date
    ON dbo.HarvestRequests (Status ASC, RequestDate DESC)
    INCLUDE (HarvestRequestId, CultivationId, UserId, HarvestType, CustomerNote);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_HarvestRequests_Status_Date.';
END
GO

-- [P5] CultivationLogs: Tăng tốc timeline nhật ký canh tác
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CultivationLogs_CultivationId_LogDate'
               AND object_id = OBJECT_ID('dbo.CultivationLogs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CultivationLogs_CultivationId_LogDate
    ON dbo.CultivationLogs (CultivationId ASC, LogDate DESC)
    INCLUDE (LogId, StaffId, ActivityType, Title, PlantHealthStatus, ImageUrl, CreatedAt);
    PRINT N'[THÀNH CÔNG] Đã tạo IX_CultivationLogs_CultivationId_LogDate.';
END
GO

-- [P6] Deliveries: Tăng tốc tracking vận chuyển theo trạng thái
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
-- 6. STORED PROCEDURES — XUẤT DỮ LIỆU TỐI ƯU HÓA
-- =====================================================================================

-- SP1: Xuất lịch sử đơn hàng với phân trang + filter
IF OBJECT_ID('dbo.sp_ExportOrderHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ExportOrderHistory;
GO

CREATE PROCEDURE dbo.sp_ExportOrderHistory
    @UserId        INT           = NULL,       -- NULL = xuất tất cả (Admin)
    @Status        NVARCHAR(30)  = NULL,       -- Lọc theo trạng thái đơn
    @FromDate      DATE          = NULL,       -- Ngày bắt đầu
    @ToDate        DATE          = NULL,       -- Ngày kết thúc
    @PageNumber    INT           = 1,          -- Phân trang (bắt đầu từ 1)
    @PageSize      INT           = 20,         -- Số bản ghi mỗi trang (tối đa 100)
    @TotalCount    INT           = NULL OUTPUT -- Trả về tổng số bản ghi (để phân trang phía client)
AS
BEGIN
    SET NOCOUNT ON;
    SET ARITHABORT ON;

    -- Giới hạn PageSize tối đa 100 để bảo vệ hiệu năng
    IF @PageSize > 100 SET @PageSize = 100;
    IF @PageNumber < 1  SET @PageNumber = 1;

    -- Đếm tổng số bản ghi (cho phân trang)
    SELECT @TotalCount = COUNT(*)
    FROM dbo.RentalOrders ro WITH (NOLOCK)
    WHERE (@UserId IS NULL OR ro.UserId = @UserId)
      AND (@Status IS NULL OR ro.Status = @Status)
      AND (@FromDate IS NULL OR CAST(ro.CreatedAt AS DATE) >= @FromDate)
      AND (@ToDate   IS NULL OR CAST(ro.CreatedAt AS DATE) <= @ToDate);

    -- Xuất dữ liệu có phân trang
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

-- SP2: Xuất lịch sử canh tác kèm nhật ký và thống kê
IF OBJECT_ID('dbo.sp_ExportCultivationHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ExportCultivationHistory;
GO

CREATE PROCEDURE dbo.sp_ExportCultivationHistory
    @UserId        INT           = NULL,       -- NULL = xuất tất cả (Admin)
    @PlotId        INT           = NULL,       -- Lọc theo ô đất cụ thể
    @Status        NVARCHAR(30)  = NULL,       -- Lọc theo trạng thái mùa vụ
    @FromDate      DATE          = NULL,       -- Ngày bắt đầu mùa vụ
    @ToDate        DATE          = NULL,       -- Ngày kết thúc
    @PageNumber    INT           = 1,
    @PageSize      INT           = 20,
    @TotalCount    INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET ARITHABORT ON;

    IF @PageSize > 100 SET @PageSize = 100;
    IF @PageNumber < 1  SET @PageNumber = 1;

    -- Đếm tổng bản ghi
    SELECT @TotalCount = COUNT(*)
    FROM dbo.Cultivations c WITH (NOLOCK)
    INNER JOIN dbo.RentalOrders ro WITH (NOLOCK) ON c.OrderId = ro.OrderId
    WHERE (@UserId  IS NULL OR ro.UserId  = @UserId)
      AND (@PlotId  IS NULL OR c.PlotId   = @PlotId)
      AND (@Status  IS NULL OR c.Status   = @Status)
      AND (@FromDate IS NULL OR c.StartDate >= @FromDate)
      AND (@ToDate   IS NULL OR c.StartDate <= @ToDate);

    -- Xuất dữ liệu canh tác kèm thống kê log
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
        -- Thống kê nhật ký (sub-query tối ưu hơn JOIN nhiều hàng)
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
-- TỔNG KẾT KIỂM TRA SCHEMA CSDL
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
WHERE t.name IN ('Roles', 'Users', 'UserAddresses', 'CareSchedules')
ORDER BY t.name, c.column_id;
GO
