-- =====================================================================================
-- HỆ THỐNG NỀN TẢNG CANH TÁC THÔNG MINH & CHO THUÊ Ô ĐẤT PLOTFARM
-- Script T-SQL: Khởi tạo bảng UserAddresses (Sổ địa chỉ nhận rau củ thu hoạch)
-- Ngày thực hiện: 11/09/2026
-- Người thực hiện: Âu Lương Thành Trọng (Leader / Database Architect) - PlotFarm Team 4
-- =====================================================================================

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
PRINT N'BẮT ĐẦU THỰC THI SCRIPT T-SQL KHỞI TẠO & CẬP NHẬT BẢNG UserAddresses...';
PRINT N'-------------------------------------------------------------------------';

-- 1. Tạo bảng dbo.UserAddresses nếu chưa tồn tại
IF OBJECT_ID('dbo.UserAddresses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserAddresses (
        AddressId INT IDENTITY(1,1) NOT NULL,
        UserId INT NOT NULL,
        RecipientName NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(20) NOT NULL,
        AddressLine NVARCHAR(255) NOT NULL,
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
    PRINT N'[THÔNG TIN] Bảng dbo.UserAddresses đã tồn tại. Đang tiến hành kiểm tra và chuẩn hóa cấu trúc...';

    -- 1.1 Kiểm tra và bổ sung cột AddressLine
    IF COL_LENGTH('dbo.UserAddresses', 'AddressLine') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD AddressLine NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
        BEGIN
            EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = AddressDetail WHERE AddressLine IS NULL;');
        END
        EXEC(N'UPDATE dbo.UserAddresses SET AddressLine = N'''' WHERE AddressLine IS NULL;');
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressLine NVARCHAR(255) NOT NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung và chuẩn hóa cột AddressLine NVARCHAR(255) NOT NULL.';
    END

    -- 1.2 Cho phép AddressDetail NULL nếu bảng cũ tồn tại cột này
    IF COL_LENGTH('dbo.UserAddresses', 'AddressDetail') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ALTER COLUMN AddressDetail NVARCHAR(255) NULL;
    END

    -- 1.3 Kiểm tra và bổ sung cột UpdatedAt
    IF COL_LENGTH('dbo.UserAddresses', 'UpdatedAt') IS NULL
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD UpdatedAt DATETIME2(0) NULL;
        PRINT N'[CẬP NHẬT] Đã bổ sung cột UpdatedAt DATETIME2(0) NULL.';
    END

    -- 1.4 Chuẩn hóa cột District cho phép NULL (do một số đơn vị hành chính đặc thù)
    ALTER TABLE dbo.UserAddresses ALTER COLUMN District NVARCHAR(100) NULL;

    -- 1.5 Kiểm tra và bổ sung khóa ngoại FK_UserAddresses_Users
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_UserAddresses_Users' AND parent_object_id = OBJECT_ID('dbo.UserAddresses'))
    BEGIN
        ALTER TABLE dbo.UserAddresses WITH CHECK ADD CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users (UserId);
        PRINT N'[CẬP NHẬT] Đã tạo khóa ngoại FK_UserAddresses_Users liên kết tới Users(UserId).';
    END

    -- 1.6 Kiểm tra và bổ sung Default Constraint cho IsDefault
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'IsDefault')
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_IsDefault DEFAULT 0 FOR IsDefault;
        PRINT N'[CẬP NHẬT] Đã tạo ràng buộc mặc định DF_UserAddresses_IsDefault (DEFAULT 0).';
    END

    -- 1.7 Kiểm tra và bổ sung Default Constraint cho CreatedAt
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses') AND col_name(parent_object_id, parent_column_id) = 'CreatedAt')
    BEGIN
        ALTER TABLE dbo.UserAddresses ADD CONSTRAINT DF_UserAddresses_CreatedAt DEFAULT SYSDATETIME() FOR CreatedAt;
        PRINT N'[CẬP NHẬT] Đã tạo ràng buộc mặc định DF_UserAddresses_CreatedAt (DEFAULT SYSDATETIME()).';
    END
END;
GO

-- 2. Tạo Chỉ mục tìm kiếm theo UserId (Index tối ưu hóa truy vấn sổ địa chỉ người dùng)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserAddresses_UserId' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserAddresses_UserId 
    ON dbo.UserAddresses (UserId ASC, IsDefault DESC, AddressId DESC);
    PRINT N'[THÀNH CÔNG] Đã tạo Index IX_UserAddresses_UserId tối ưu hóa truy vấn sổ địa chỉ.';
END;
GO

-- 3. Tạo Chỉ mục duy nhất có điều kiện (Filtered Unique Index):
-- Nghiệp vụ cốt lõi: Mỗi người dùng (UserId) chỉ được phép có TỐI ĐA 1 địa chỉ nhận rau mặc định (IsDefault = 1)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAddresses_Default' AND object_id = OBJECT_ID('dbo.UserAddresses'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_UserAddresses_Default 
    ON dbo.UserAddresses (UserId) 
    WHERE IsDefault = 1;
    PRINT N'[THÀNH CÔNG] Đã tạo Filtered Unique Index UX_UserAddresses_Default (Đảm bảo duy nhất 1 địa chỉ mặc định/user).';
END;
GO

PRINT N'-------------------------------------------------------------------------';
PRINT N'HOÀN TẤT THỰC THI SCRIPT T-SQL BẢNG UserAddresses THÀNH CÔNG 100%!';
PRINT N'-------------------------------------------------------------------------';
GO
