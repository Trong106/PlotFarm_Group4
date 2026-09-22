-- ============================================================================
-- DỰ ÁN: NỀN TẢNG CHO THUÊ Ô ĐẤT CANH TÁC TRỰC TUYẾN (PLOTFARM)
-- MODULE: QUẢN LÝ THÔNG TIN CÁ NHÂN & SỔ ĐỊA CHỈ (USER PROFILE & ADDRESSES)
-- TÁC GIẢ: Nhóm Phát Triển PlotFarm - Nhánh DucTM
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019+
-- NỘI DUNG: Seed Data khởi tạo 1 Admin, 2 Staff, 2 Customer và Sổ địa chỉ mặc định
-- MẬT KHẨU:
--   - Admin:    Admin@2026!    (Hash bcrypt chuẩn 10 rounds)
--   - Staff:    Staff@2026!    (Hash bcrypt chuẩn 10 rounds)
--   - Customer: Customer@2026! (Hash bcrypt chuẩn 10 rounds)
-- ============================================================================

USE PlotFarmDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    -- ────────────────────────────────────────────────────────────────────────
    -- 1. SEED BẢNG ROLES (NẾU CHƯA CÓ)
    -- ────────────────────────────────────────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Admin')
        INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Admin', N'Quản trị viên toàn quyền hệ thống');

    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Staff')
        INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Staff', N'Kỹ thuật viên nông trại chăm sóc và đăng nhật ký');

    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Customer')
        INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Customer', N'Khách hàng thuê đất và theo dõi mùa vụ');

    -- Lấy RoleId tương ứng
    DECLARE @AdminRoleId INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Admin');
    DECLARE @StaffRoleId INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Staff');
    DECLARE @CustomerRoleId INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Customer');

    -- ────────────────────────────────────────────────────────────────────────
    -- 2. SEED BẢNG USERS (1 ADMIN, 2 STAFF, 2 CUSTOMER)
    -- Hash đã được tạo sẵn từ bcryptjs với 10 salt rounds:
    -- 'Admin@2026!'    -> $2a$10$jw6fVtLCe7muOnyDynF2A.Q/WLZuIRMxKN2ZEPXI2YTqs1Rcp2tUe
    -- 'Staff@2026!'    -> $2a$10$CSdDWvVCbusAnQCDmLZ34e4AUn0TfCvsMBXWCpXNnMAzN8D9cK8jW
    -- 'Customer@2026!' -> $2a$10$Jvva79Tv4cxGNurWr5T7eOByeXRRdQgKwgqieqDEPKjWIHhdYNLbW
    -- ────────────────────────────────────────────────────────────────────────

    -- 2.1. Tài khoản Admin (1)
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'admin@plotfarm.vn')
    BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        VALUES (
            @AdminRoleId,
            N'Quản Trị Viên PlotFarm',
            'admin@plotfarm.vn',
            '$2a$10$jw6fVtLCe7muOnyDynF2A.Q/WLZuIRMxKN2ZEPXI2YTqs1Rcp2tUe',
            '0901000001',
            'ACTIVE'
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.Users
        SET RoleId = @AdminRoleId,
            FullName = N'Quản Trị Viên PlotFarm',
            PasswordHash = '$2a$10$jw6fVtLCe7muOnyDynF2A.Q/WLZuIRMxKN2ZEPXI2YTqs1Rcp2tUe',
            PhoneNumber = '0901000001',
            Status = 'ACTIVE',
            UpdatedAt = SYSDATETIME()
        WHERE Email = 'admin@plotfarm.vn';
    END

    -- 2.2. Tài khoản Staff (Staff 1 - Nguyễn Minh Khoa)
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'khoa.staff@plotfarm.vn')
    BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        VALUES (
            @StaffRoleId,
            N'Nguyễn Minh Khoa',
            'khoa.staff@plotfarm.vn',
            '$2a$10$CSdDWvVCbusAnQCDmLZ34e4AUn0TfCvsMBXWCpXNnMAzN8D9cK8jW',
            '0902000001',
            'ACTIVE'
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.Users
        SET RoleId = @StaffRoleId,
            FullName = N'Nguyễn Minh Khoa',
            PasswordHash = '$2a$10$CSdDWvVCbusAnQCDmLZ34e4AUn0TfCvsMBXWCpXNnMAzN8D9cK8jW',
            PhoneNumber = '0902000001',
            Status = 'ACTIVE',
            UpdatedAt = SYSDATETIME()
        WHERE Email = 'khoa.staff@plotfarm.vn';
    END

    -- 2.3. Tài khoản Staff (Staff 2 - Trần Thị Hương)
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'huong.staff@plotfarm.vn')
    BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        VALUES (
            @StaffRoleId,
            N'Trần Thị Hương',
            'huong.staff@plotfarm.vn',
            '$2a$10$CSdDWvVCbusAnQCDmLZ34e4AUn0TfCvsMBXWCpXNnMAzN8D9cK8jW',
            '0902000002',
            'ACTIVE'
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.Users
        SET RoleId = @StaffRoleId,
            FullName = N'Trần Thị Hương',
            PasswordHash = '$2a$10$CSdDWvVCbusAnQCDmLZ34e4AUn0TfCvsMBXWCpXNnMAzN8D9cK8jW',
            PhoneNumber = '0902000002',
            Status = 'ACTIVE',
            UpdatedAt = SYSDATETIME()
        WHERE Email = 'huong.staff@plotfarm.vn';
    END

    -- 2.4. Tài khoản Customer (Customer 1 - Lê Văn Bình)
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'binh.customer@plotfarm.vn')
    BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        VALUES (
            @CustomerRoleId,
            N'Lê Văn Bình',
            'binh.customer@plotfarm.vn',
            '$2a$10$Jvva79Tv4cxGNurWr5T7eOByeXRRdQgKwgqieqDEPKjWIHhdYNLbW',
            '0903000001',
            'ACTIVE'
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.Users
        SET RoleId = @CustomerRoleId,
            FullName = N'Lê Văn Bình',
            PasswordHash = '$2a$10$Jvva79Tv4cxGNurWr5T7eOByeXRRdQgKwgqieqDEPKjWIHhdYNLbW',
            PhoneNumber = '0903000001',
            Status = 'ACTIVE',
            UpdatedAt = SYSDATETIME()
        WHERE Email = 'binh.customer@plotfarm.vn';
    END

    -- 2.5. Tài khoản Customer (Customer 2 - Phạm Ngọc Lan)
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'lan.customer@plotfarm.vn')
    BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        VALUES (
            @CustomerRoleId,
            N'Phạm Ngọc Lan',
            'lan.customer@plotfarm.vn',
            '$2a$10$Jvva79Tv4cxGNurWr5T7eOByeXRRdQgKwgqieqDEPKjWIHhdYNLbW',
            '0903000002',
            'ACTIVE'
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.Users
        SET RoleId = @CustomerRoleId,
            FullName = N'Phạm Ngọc Lan',
            PasswordHash = '$2a$10$Jvva79Tv4cxGNurWr5T7eOByeXRRdQgKwgqieqDEPKjWIHhdYNLbW',
            PhoneNumber = '0903000002',
            Status = 'ACTIVE',
            UpdatedAt = SYSDATETIME()
        WHERE Email = 'lan.customer@plotfarm.vn';
    END

    -- ────────────────────────────────────────────────────────────────────────
    -- 3. SEED BẢNG USER_ADDRESSES (SỔ ĐỊA CHỈ CHO CÁC TÀI KHOẢN)
    -- ────────────────────────────────────────────────────────────────────────
    DECLARE @AdminId INT    = (SELECT UserId FROM dbo.Users WHERE Email = 'admin@plotfarm.vn');
    DECLARE @Staff1Id INT   = (SELECT UserId FROM dbo.Users WHERE Email = 'khoa.staff@plotfarm.vn');
    DECLARE @Staff2Id INT   = (SELECT UserId FROM dbo.Users WHERE Email = 'huong.staff@plotfarm.vn');
    DECLARE @Customer1Id INT = (SELECT UserId FROM dbo.Users WHERE Email = 'binh.customer@plotfarm.vn');
    DECLARE @Customer2Id INT = (SELECT UserId FROM dbo.Users WHERE Email = 'lan.customer@plotfarm.vn');

    -- Địa chỉ Admin
    IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE UserId = @AdminId)
        INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        VALUES (@AdminId, N'Quản Trị Viên PlotFarm', '0901000001', N'123 Đường Công Nghệ Cao', N'Phường Long Thạnh Mỹ', N'Thành phố Thủ Đức', N'Thành phố Hồ Chí Minh', 1);

    -- Địa chỉ Staff 1
    IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE UserId = @Staff1Id)
        INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        VALUES (@Staff1Id, N'Nguyễn Minh Khoa', '0902000001', N'Khu A - Trạm Kỹ Thuật Nông Trại PlotFarm', N'Phường Tân Phú', N'Thành phố Thủ Đức', N'Thành phố Hồ Chí Minh', 1);

    -- Địa chỉ Staff 2
    IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE UserId = @Staff2Id)
        INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        VALUES (@Staff2Id, N'Trần Thị Hương', '0902000002', N'Khu B - Vườn Ươm PlotFarm Củ Chi', N'Xã An Nhơn Tây', N'Huyện Củ Chi', N'Thành phố Hồ Chí Minh', 1);

    -- Địa chỉ Customer 1
    IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE UserId = @Customer1Id)
        INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        VALUES (@Customer1Id, N'Lê Văn Bình', '0903000001', N'45/2 Đường Nguyễn Huệ', N'Phường Bến Nghé', N'Quận 1', N'Thành phố Hồ Chí Minh', 1);

    -- Địa chỉ Customer 2
    IF NOT EXISTS (SELECT 1 FROM dbo.UserAddresses WHERE UserId = @Customer2Id)
        INSERT INTO dbo.UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        VALUES (@Customer2Id, N'Phạm Ngọc Lan', '0903000002', N'88 Đường Lê Thánh Tôn', N'Phường Bến Thành', N'Quận 1', N'Thành phố Hồ Chí Minh', 1);

    -- ────────────────────────────────────────────────────────────────────────
    -- 3.5. PHÂN CÔNG KỸ THUẬT VIÊN PHỤ TRÁCH PHÂN KHU (STAFF ASSIGNMENTS)
    -- ────────────────────────────────────────────────────────────────────────
    DECLARE @DefaultArea1Id INT = (SELECT TOP 1 AreaId FROM dbo.FarmAreas ORDER BY AreaId ASC);
    DECLARE @DefaultArea2Id INT = (SELECT TOP 1 AreaId FROM dbo.FarmAreas ORDER BY AreaId DESC);

    IF @DefaultArea1Id IS NOT NULL AND @Staff1Id IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.StaffAssignments WHERE StaffId = @Staff1Id AND AreaId = @DefaultArea1Id)
            INSERT INTO dbo.StaffAssignments (StaffId, AreaId, Shift, AssignedDate, Notes)
            VALUES (@Staff1Id, @DefaultArea1Id, N'SÁNG', CAST(SYSDATETIME() AS DATE), N'Phụ trách kiểm tra độ ẩm và cảm biến ca sáng');
    END;

    IF @DefaultArea2Id IS NOT NULL AND @Staff2Id IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.StaffAssignments WHERE StaffId = @Staff2Id AND AreaId = @DefaultArea2Id)
            INSERT INTO dbo.StaffAssignments (StaffId, AreaId, Shift, AssignedDate, Notes)
            VALUES (@Staff2Id, @DefaultArea2Id, N'CHIỀU', CAST(SYSDATETIME() AS DATE), N'Phụ trách phân khu nông trại ca chiều');
    END;

    COMMIT TRANSACTION;
    PRINT N'[THÀNH CÔNG] Dữ liệu khởi tạo (1 Admin, 2 Staff, 2 Customer và Phân công nhân sự) đã được chèn thành công!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(N'[LỖI SEED DATA]: %s', 16, 1, @ErrorMessage);
END CATCH;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 4. HIỂN THỊ KẾT QUẢ KIỂM TRA
-- ────────────────────────────────────────────────────────────────────────
SELECT 
    u.UserId,
    r.RoleName AS [Role],
    u.FullName,
    u.Email,
    u.PhoneNumber,
    u.Status,
    a.AddressLine + ', ' + a.Ward + ', ' + ISNULL(a.District + ', ', '') + a.Province AS [DiaChiMacDinh]
FROM dbo.Users u
JOIN dbo.Roles r ON u.RoleId = r.RoleId
LEFT JOIN dbo.UserAddresses a ON u.UserId = a.UserId AND a.IsDefault = 1
ORDER BY r.RoleName, u.UserId;
GO
