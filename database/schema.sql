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
-- 4. BẢNG dbo.CarePackages (Gói dịch vụ chăm sóc nông trại)
-- =====================================================================================
IF OBJECT_ID('dbo.CarePackages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CarePackages (
        PackageId INT IDENTITY(1,1) NOT NULL,
        PackageName NVARCHAR(100) NOT NULL,
        MonthlyFee DECIMAL(12,2) NOT NULL CONSTRAINT DF_CarePackages_MonthlyFee DEFAULT 0,
        Description NVARCHAR(500) NULL,
        ServicesIncluded NVARCHAR(MAX) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CarePackages_IsActive DEFAULT 1,
        CONSTRAINT PK_CarePackages PRIMARY KEY CLUSTERED (PackageId ASC)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo mới bảng dbo.CarePackages.';
END
GO

-- =====================================================================================
-- 5. BẢNG dbo.Seeds (Danh mục hạt giống và nông sản)
-- =====================================================================================
IF OBJECT_ID('dbo.Seeds', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Seeds (
        SeedId INT IDENTITY(1,1) NOT NULL,
        SeedName NVARCHAR(100) NOT NULL,
        Category NVARCHAR(50) NOT NULL,
        GrowthDurationDays INT NOT NULL,
        MinRentalDays INT NOT NULL DEFAULT 30,
        ExpectedYieldKgPerM2 DECIMAL(5,2) NOT NULL,
        SuitableSoilType NVARCHAR(100) NOT NULL,
        Season NVARCHAR(50) NOT NULL,
        SeedPrice DECIMAL(12,2) NOT NULL DEFAULT 0,
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        IsAvailable BIT NOT NULL CONSTRAINT DF_Seeds_IsAvailable DEFAULT 1,
        CONSTRAINT PK_Seeds PRIMARY KEY CLUSTERED (SeedId ASC)
    );
    PRINT N'[THÀNH CÔNG] Đã tạo mới bảng dbo.Seeds.';
END
GO

-- =====================================================================================
-- 6. BẢNG dbo.StaffAssignments (Phân công nhân sự kỹ thuật theo khu vực)
-- =====================================================================================
IF OBJECT_ID('dbo.StaffAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StaffAssignments (
        AssignmentId INT IDENTITY(1,1) NOT NULL,
        StaffId INT NOT NULL,
        AreaId INT NOT NULL,
        Shift NVARCHAR(50) NOT NULL CONSTRAINT DF_StaffAssignments_Shift DEFAULT N'SÁNG',
        AssignedDate DATE NOT NULL CONSTRAINT DF_StaffAssignments_AssignedDate DEFAULT CAST(SYSDATETIME() AS DATE),
        Notes NVARCHAR(255) NULL,
        CONSTRAINT PK_StaffAssignments PRIMARY KEY CLUSTERED (AssignmentId ASC),
        CONSTRAINT FK_StaffAssignments_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    PRINT N'[THÀNH CÔNG] Đã tạo mới bảng dbo.StaffAssignments với PK và FK tham chiếu Users(UserId).';
END
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
WHERE t.name IN ('Roles', 'Users', 'UserAddresses', 'CarePackages', 'Seeds', 'StaffAssignments')
ORDER BY t.name, c.column_id;
GO
