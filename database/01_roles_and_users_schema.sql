-- ============================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC TRỰC TUYẾN (PLOTFARM)
-- MODULE: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (AUTH & USERS)
-- TÁC GIẢ: Âu Lương Thành Trọng (Leader / Database Architect) - NGÀY 6
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019+
-- NỘI DUNG: Khởi tạo Table Roles, Users, PK, FK, Unique, Check, Indexes & Defaults
-- ============================================================================

USE master;
GO

-- 1. Khởi tạo Database PlotFarmDB nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PlotFarmDB')
BEGIN
    CREATE DATABASE PlotFarmDB COLLATE Vietnamese_CI_AS;
END
GO

USE PlotFarmDB;
GO

-- 2. TẠO BẢNG ROLES (Vai trò người dùng)
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId INT IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_RoleName UNIQUE,
        Description NVARCHAR(255) NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSDATETIME()
    );
END
GO

-- Seed dữ liệu mẫu cho Roles nếu chưa có
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Admin')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Admin', N'Quản trị viên toàn quyền hệ thống');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Staff')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Staff', N'Kỹ thuật viên nông trại chăm sóc và đăng nhật ký');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Customer')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Customer', N'Khách hàng thuê đất và theo dõi mùa vụ');
GO

-- 3. TẠO BẢNG USERS (Tài khoản người dùng)
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
END
GO

-- 4. TỐI ƯU HÓA HIỆU NĂNG: TẠO CHỈ MỤC (NON-CLUSTERED INDEXES)
-- Index tìm kiếm tài khoản theo Email khi Đăng nhập (Authentication)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Email 
    ON dbo.Users(Email) 
    INCLUDE (UserId, RoleId, PasswordHash, FullName, Status);
END
GO

-- Index lọc danh sách theo vai trò RoleId (Dành cho chức năng quản trị Admin)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_RoleId' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_RoleId 
    ON dbo.Users(RoleId);
END
GO

-- Index lọc người dùng theo trạng thái hoạt động (Active/Locked)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Status' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Status 
    ON dbo.Users(Status);
END
GO

-- 5. TRUY VẤN KIỂM TRA NGHIỆM THU
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
WHERE t.name IN ('Roles', 'Users')
ORDER BY t.name, c.column_id;
GO
