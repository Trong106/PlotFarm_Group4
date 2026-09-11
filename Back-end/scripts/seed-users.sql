-- =============================================================
-- PlotFarm - Seed Data Script (SQL Server - SSMS)
-- Script chen du lieu khoi tao: Roles, Users, UserAddresses
-- Chay file nay trong SSMS de khong can ket noi Node.js
-- =============================================================
-- Cach dung:
--   1. Mo SSMS, ket noi vao SQL Server cua ban
--   2. Chon database PlotFarmDB (hoac thay ten database o dong USE)
--   3. Chay toan bo script nay (F5)
-- =============================================================

USE PlotFarmDB;
GO

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Khoi tao Roles (MERGE idempotent)
-- ─────────────────────────────────────────────────────────────
PRINT '>>> STEP 1: Khoi tao Roles...';

MERGE INTO Roles AS target
USING (VALUES
    ('Admin',    'Quan tri vien he thong PlotFarm, toan quyen quan ly'),
    ('Staff',    'Nhan vien ky thuat, ho tro canh tac va cham soc o dat'),
    ('Customer', 'Khach hang thue o dat nong trai va su dung dich vu')
) AS source (RoleName, Description)
ON target.RoleName = source.RoleName
WHEN NOT MATCHED THEN
    INSERT (RoleName, Description) VALUES (source.RoleName, source.Description)
WHEN MATCHED THEN
    UPDATE SET Description = source.Description;

SELECT 'Roles hien tai:' AS Info;
SELECT RoleId, RoleName, Description FROM Roles ORDER BY RoleId;
GO

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Hash mat khau bang bcrypt (hardcoded hash)
-- Note: Cac hash duoi day tuong ung mat khau sau:
--   Admin@2026!    -> admin hash
--   Staff@2026!    -> staff hash
--   Customer@2026! -> customer hash
--
-- Hash duoc tao voi bcryptjs cost=10. De doi mat khau,
-- dung Node.js: require("bcryptjs").hashSync("MatKhauMoi", 10)
-- ─────────────────────────────────────────────────────────────
PRINT '>>> STEP 2: Khoi tao Users...';

-- Khai bao bien luu hash (chay trong batch tach biet)
DECLARE @AdminHash    NVARCHAR(255);
DECLARE @StaffHash    NVARCHAR(255);
DECLARE @CustomerHash NVARCHAR(255);
DECLARE @AdminRoleId    INT;
DECLARE @StaffRoleId    INT;
DECLARE @CustomerRoleId INT;

-- Lay RoleId
SELECT @AdminRoleId    = RoleId FROM Roles WHERE RoleName = 'Admin';
SELECT @StaffRoleId    = RoleId FROM Roles WHERE RoleName = 'Staff';
SELECT @CustomerRoleId = RoleId FROM Roles WHERE RoleName = 'Customer';

-- !!! QUAN TRONG: Thay the cac hash duoi day bang hash that tu Node.js
-- De lay hash that, chay: node -e "console.log(require('bcryptjs').hashSync('Admin@2026!',10))"
-- Cac hash MAU duoi day se KHONG dang nhap duoc - chi de placeholder
SET @AdminHash    = N'$2a$10$BbGy.iCeZXJXpmsOMgZrw.B6v2n64WCWw5tJL43U2ikQF/7kXMc0a';
SET @StaffHash    = N'$2a$10$tJl59E1eJnQK8y0qb8VTCOSpTwlNO.cFGzRfUhRr/kULUz49db7hy';
SET @CustomerHash = N'$2a$10$ww8.qR141b757i1EfKzCA.mVtUpKfA2FFnznUTwoIJCxevBERerwG';

-- ── Admin ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@plotfarm.vn')
BEGIN
    INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
    VALUES (@AdminRoleId, N'Quan Tri Vien PlotFarm', 'admin@plotfarm.vn', @AdminHash, '0901000001', 'ACTIVE');
    PRINT '  [OK] Admin: admin@plotfarm.vn da duoc tao';
END ELSE
    PRINT '  [SKIP] Admin: admin@plotfarm.vn da ton tai';

-- ── Staff 1 ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'khoa.staff@plotfarm.vn')
BEGIN
    INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
    VALUES (@StaffRoleId, N'Nguyen Minh Khoa', 'khoa.staff@plotfarm.vn', @StaffHash, '0902000001', 'ACTIVE');
    PRINT '  [OK] Staff 1: khoa.staff@plotfarm.vn da duoc tao';
END ELSE
    PRINT '  [SKIP] Staff 1: khoa.staff@plotfarm.vn da ton tai';

-- ── Staff 2 ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'huong.staff@plotfarm.vn')
BEGIN
    INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
    VALUES (@StaffRoleId, N'Tran Thi Huong', 'huong.staff@plotfarm.vn', @StaffHash, '0902000002', 'ACTIVE');
    PRINT '  [OK] Staff 2: huong.staff@plotfarm.vn da duoc tao';
END ELSE
    PRINT '  [SKIP] Staff 2: huong.staff@plotfarm.vn da ton tai';

-- ── Customer 1 ─────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'binh.customer@plotfarm.vn')
BEGIN
    INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
    VALUES (@CustomerRoleId, N'Le Van Binh', 'binh.customer@plotfarm.vn', @CustomerHash, '0903000001', 'ACTIVE');
    PRINT '  [OK] Customer 1: binh.customer@plotfarm.vn da duoc tao';
END ELSE
    PRINT '  [SKIP] Customer 1: binh.customer@plotfarm.vn da ton tai';

-- ── Customer 2 ─────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'lan.customer@plotfarm.vn')
BEGIN
    INSERT INTO Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
    VALUES (@CustomerRoleId, N'Pham Ngoc Lan', 'lan.customer@plotfarm.vn', @CustomerHash, '0903000002', 'ACTIVE');
    PRINT '  [OK] Customer 2: lan.customer@plotfarm.vn da duoc tao';
END ELSE
    PRINT '  [SKIP] Customer 2: lan.customer@plotfarm.vn da ton tai';
GO

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Khoi tao UserAddresses
-- ─────────────────────────────────────────────────────────────
PRINT '>>> STEP 3: Khoi tao UserAddresses...';

-- Admin address
IF NOT EXISTS (
    SELECT 1 FROM UserAddresses a
    JOIN Users u ON a.UserId = u.UserId
    WHERE u.Email = 'admin@plotfarm.vn'
)
BEGIN
    INSERT INTO UserAddresses (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
    SELECT u.UserId, N'Tru so chinh', N'Quan Tri Vien PlotFarm', '0901000001',
           N'Thanh pho Ho Chi Minh', N'Quan 1', N'Phuong Ben Nghe', N'123 Nguyen Hue', 1
    FROM Users u WHERE u.Email = 'admin@plotfarm.vn';
    PRINT '  [OK] Dia chi Admin da them';
END

-- Staff 1 address
IF NOT EXISTS (
    SELECT 1 FROM UserAddresses a
    JOIN Users u ON a.UserId = u.UserId
    WHERE u.Email = 'khoa.staff@plotfarm.vn'
)
BEGIN
    INSERT INTO UserAddresses (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
    SELECT u.UserId, N'Nha rieng', N'Nguyen Minh Khoa', '0902000001',
           N'Thanh pho Ho Chi Minh', N'Quan Binh Thanh', N'Phuong 25', N'47 Xo Viet Nghe Tinh', 1
    FROM Users u WHERE u.Email = 'khoa.staff@plotfarm.vn';
    PRINT '  [OK] Dia chi Staff 1 da them';
END

-- Staff 2 address
IF NOT EXISTS (
    SELECT 1 FROM UserAddresses a
    JOIN Users u ON a.UserId = u.UserId
    WHERE u.Email = 'huong.staff@plotfarm.vn'
)
BEGIN
    INSERT INTO UserAddresses (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
    SELECT u.UserId, N'Nha rieng', N'Tran Thi Huong', '0902000002',
           N'Thanh pho Ho Chi Minh', N'Quan Thu Duc', N'Phuong Linh Trung', N'89 Vo Van Ngan', 1
    FROM Users u WHERE u.Email = 'huong.staff@plotfarm.vn';
    PRINT '  [OK] Dia chi Staff 2 da them';
END

-- Customer 1 address
IF NOT EXISTS (
    SELECT 1 FROM UserAddresses a
    JOIN Users u ON a.UserId = u.UserId
    WHERE u.Email = 'binh.customer@plotfarm.vn'
)
BEGIN
    INSERT INTO UserAddresses (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
    SELECT u.UserId, N'Nha rieng', N'Le Van Binh', '0903000001',
           N'Thanh pho Ho Chi Minh', N'Quan 7', N'Phuong Tan Phu', N'12 Nguyen Thi Thap', 1
    FROM Users u WHERE u.Email = 'binh.customer@plotfarm.vn';
    PRINT '  [OK] Dia chi Customer 1 da them';
END

-- Customer 2 address
IF NOT EXISTS (
    SELECT 1 FROM UserAddresses a
    JOIN Users u ON a.UserId = u.UserId
    WHERE u.Email = 'lan.customer@plotfarm.vn'
)
BEGIN
    INSERT INTO UserAddresses (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
    SELECT u.UserId, N'Dia chi nhan hang', N'Pham Ngoc Lan', '0903000002',
           N'Thanh pho Ho Chi Minh', N'Quan 9', N'Phuong Long Thanh My', N'56 Do Xuan Hop', 1
    FROM Users u WHERE u.Email = 'lan.customer@plotfarm.vn';
    PRINT '  [OK] Dia chi Customer 2 da them';
END
GO

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Tom tat ket qua
-- ─────────────────────────────────────────────────────────────
PRINT '>>> STEP 4: Tom tat du lieu:';

SELECT
    r.RoleName          AS [Vai tro],
    COUNT(u.UserId)     AS [So luong User]
FROM Roles r
LEFT JOIN Users u ON r.RoleId = u.RoleId
GROUP BY r.RoleName
ORDER BY r.RoleName;

SELECT
    u.UserId            AS [ID],
    r.RoleName          AS [Vai tro],
    u.FullName          AS [Ho ten],
    u.Email             AS [Email],
    u.PhoneNumber       AS [SDT],
    u.Status            AS [Trang thai],
    u.CreatedAt         AS [Ngay tao],
    (SELECT COUNT(*) FROM UserAddresses a WHERE a.UserId = u.UserId) AS [So dia chi]
FROM Users u
JOIN Roles r ON u.RoleId = r.RoleId
ORDER BY r.RoleName, u.UserId;
GO

PRINT '=== Seed hoan thanh! ===';
GO
