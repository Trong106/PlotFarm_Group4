-- Run after 01_roles_and_users_schema.sql. Safe to run again; preserves existing data.
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

IF OBJECT_ID('dbo.UserAddresses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserAddresses (
        AddressId INT IDENTITY(1,1) CONSTRAINT PK_UserAddresses PRIMARY KEY,
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
        CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserAddresses_UserId' AND object_id = OBJECT_ID('dbo.UserAddresses'))
    CREATE INDEX IX_UserAddresses_UserId ON dbo.UserAddresses(UserId, IsDefault DESC, AddressId DESC);
GO

-- Final database guard against multiple default addresses, including concurrent writes.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAddresses_Default' AND object_id = OBJECT_ID('dbo.UserAddresses'))
    CREATE UNIQUE INDEX UX_UserAddresses_Default ON dbo.UserAddresses(UserId) WHERE IsDefault = 1;
GO
