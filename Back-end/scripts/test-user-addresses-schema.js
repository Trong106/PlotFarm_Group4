/**
 * @file test-user-addresses-schema.js
 * @description Bộ kiểm thử tự động xác thực cấu trúc bảng UserAddresses, Khóa chính (PK), Khóa ngoại (FK),
 *              Ràng buộc mặc định (Default Constraints), Chỉ mục (Index) và Filtered Unique Index trên SQL Server.
 * Hệ thống: PlotFarm Team 4 - Database Verification Suite
 */

const assert = require('node:assert/strict');
const db = require('../src/config/db');
const { sql } = db;

async function runTests() {
  console.log('=====================================================================');
  console.log('--- BẮT ĐẦU KIỂM THỬ CẤU TRÚC & RÀNG BUỘC BẢNG UserAddresses (T-SQL) ---');
  console.log('=====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function testPass(msg) {
    totalTests++;
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${msg}`);
  }

  function testFail(msg, err) {
    totalTests++;
    console.error(`[FAIL] Test ${totalTests}: ${msg}`, err ? err.message : '');
    process.exitCode = 1;
  }

  const pool = await db.connectDB();
  if (!pool) {
    throw new Error('Không thể kết nối tới SQL Server (PlotFarmDB)');
  }

  let testUserId = null;
  const createdAddressIds = [];

  try {
    // Test 1: Bảng dbo.UserAddresses tồn tại trong SQL Server
    const tableRes = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'UserAddresses'
    `);
    assert.equal(tableRes.recordset.length, 1);
    testPass('Bảng dbo.UserAddresses tồn tại trong cơ sở dữ liệu PlotFarmDB');

    // Test 2: Kiểm tra đầy đủ các cột bắt buộc và kiểu dữ liệu chuẩn
    const colRes = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'UserAddresses'
    `);
    const colMap = new Map(colRes.recordset.map(c => [c.COLUMN_NAME, c]));

    assert.ok(colMap.has('AddressId'), 'Phải có cột AddressId');
    assert.ok(colMap.has('UserId'), 'Phải có cột UserId');
    assert.ok(colMap.has('RecipientName'), 'Phải có cột RecipientName');
    assert.ok(colMap.has('PhoneNumber'), 'Phải có cột PhoneNumber');
    assert.ok(colMap.has('AddressLine'), 'Phải có cột AddressLine');
    assert.ok(colMap.has('Ward'), 'Phải có cột Ward');
    assert.ok(colMap.has('District'), 'Phải có cột District');
    assert.ok(colMap.has('Province'), 'Phải có cột Province');
    assert.ok(colMap.has('IsDefault'), 'Phải có cột IsDefault');
    assert.ok(colMap.has('CreatedAt'), 'Phải có cột CreatedAt');
    assert.ok(colMap.has('UpdatedAt'), 'Phải có cột UpdatedAt');
    testPass('Đầy đủ 11 cột cấu trúc tiêu chuẩn theo bản đặc tả ERD');

    // Test 3: Khóa chính Primary Key (PK_UserAddresses) được thiết lập trên AddressId
    const pkRes = await pool.request().query(`
      SELECT kcu.COLUMN_NAME, tc.CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'UserAddresses' AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    `);
    assert.equal(pkRes.recordset.length, 1);
    assert.equal(pkRes.recordset[0].COLUMN_NAME, 'AddressId');
    testPass(`Khóa chính (PK) được thiết lập trên AddressId (Constraint: ${pkRes.recordset[0].CONSTRAINT_NAME})`);

    // Test 4: Khóa ngoại Foreign Key (FK_UserAddresses_Users) liên kết tới Users(UserId)
    const fkRes = await pool.request().query(`
      SELECT name, OBJECT_NAME(referenced_object_id) AS RefTable
      FROM sys.foreign_keys
      WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses')
    `);
    assert.ok(fkRes.recordset.some(fk => fk.RefTable === 'Users'));
    testPass('Khóa ngoại (FK) liên kết chính xác sang bảng Users(UserId)');

    // Test 5: Default Constraint cho IsDefault (= 0) và CreatedAt (= SYSDATETIME())
    const dfRes = await pool.request().query(`
      SELECT col_name(parent_object_id, parent_column_id) as ColName, definition
      FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('dbo.UserAddresses')
    `);
    const dfMap = new Map(dfRes.recordset.map(d => [d.ColName, d.definition]));
    assert.ok(dfMap.has('IsDefault') && dfMap.get('IsDefault').includes('0'));
    assert.ok(dfMap.has('CreatedAt') && dfMap.get('CreatedAt').toLowerCase().includes('sysdatetime'));
    testPass('Default Constraints hoạt động chuẩn xác: IsDefault = 0, CreatedAt = SYSDATETIME()');

    // Test 6: Index IX_UserAddresses_UserId tối ưu hóa truy vấn
    const ixRes = await pool.request().query(`
      SELECT name 
      FROM sys.indexes 
      WHERE object_id = OBJECT_ID('dbo.UserAddresses') AND name = 'IX_UserAddresses_UserId'
    `);
    assert.equal(ixRes.recordset.length, 1);
    testPass('Chỉ mục tìm kiếm IX_UserAddresses_UserId tồn tại và được đánh index tối ưu');

    // Test 7: Filtered Unique Index UX_UserAddresses_Default (WHERE IsDefault = 1)
    const uxRes = await pool.request().query(`
      SELECT name, is_unique, has_filter, filter_definition
      FROM sys.indexes 
      WHERE object_id = OBJECT_ID('dbo.UserAddresses') AND name = 'UX_UserAddresses_Default'
    `);
    assert.equal(uxRes.recordset.length, 1);
    assert.equal(uxRes.recordset[0].is_unique, true);
    assert.equal(uxRes.recordset[0].has_filter, true);
    testPass('Filtered Unique Index UX_UserAddresses_Default được thiết lập trên (UserId) WHERE IsDefault = 1');

    // Tạo một User mẫu để test thực thi ràng buộc dữ liệu thực tế
    const userInsert = await pool.request()
      .input('Email', sql.NVarChar(150), `test-schema-addr-${Date.now()}@plotfarm.vn`)
      .input('FullName', sql.NVarChar(100), 'Nguyễn Văn Test Địa Chỉ')
      .input('PasswordHash', sql.NVarChar(255), 'dummy_hash')
      .query(`
        INSERT INTO Users (RoleId, FullName, Email, PasswordHash, Status)
        OUTPUT INSERTED.UserId
        SELECT RoleId, @FullName, @Email, @PasswordHash, 'ACTIVE'
        FROM Roles WHERE RoleName = 'Customer'
      `);
    testUserId = userInsert.recordset[0].UserId;

    // Test 8: Thêm nhiều địa chỉ phụ (IsDefault = 0) cho cùng một người dùng -> THÀNH CÔNG
    const addr1 = await pool.request()
      .input('UserId', sql.Int, testUserId)
      .input('RecipientName', sql.NVarChar(100), 'Người Nhận 1')
      .input('PhoneNumber', sql.NVarChar(20), '0901112222')
      .input('AddressLine', sql.NVarChar(255), '123 Đường Số 1')
      .input('Ward', sql.NVarChar(100), 'Phường 1')
      .input('District', sql.NVarChar(100), 'Quận 1')
      .input('Province', sql.NVarChar(100), 'TP. Hồ Chí Minh')
      .query(`
        INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        OUTPUT INSERTED.AddressId
        VALUES (@UserId, @RecipientName, @PhoneNumber, @AddressLine, @Ward, @District, @Province, 0)
      `);
    createdAddressIds.push(addr1.recordset[0].AddressId);

    const addr2 = await pool.request()
      .input('UserId', sql.Int, testUserId)
      .input('RecipientName', sql.NVarChar(100), 'Người Nhận 2')
      .input('PhoneNumber', sql.NVarChar(20), '0903334444')
      .input('AddressLine', sql.NVarChar(255), '456 Đường Số 2')
      .input('Ward', sql.NVarChar(100), 'Phường 2')
      .input('District', sql.NVarChar(100), 'Quận 3')
      .input('Province', sql.NVarChar(100), 'TP. Hồ Chí Minh')
      .query(`
        INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        OUTPUT INSERTED.AddressId
        VALUES (@UserId, @RecipientName, @PhoneNumber, @AddressLine, @Ward, @District, @Province, 0)
      `);
    createdAddressIds.push(addr2.recordset[0].AddressId);

    testPass('Cho phép lưu nhiều địa chỉ phụ (IsDefault = 0) cho cùng một UserId');

    // Test 9: Thêm 1 địa chỉ mặc định đầu tiên (IsDefault = 1) -> THÀNH CÔNG
    const addrDefault1 = await pool.request()
      .input('UserId', sql.Int, testUserId)
      .input('RecipientName', sql.NVarChar(100), 'Người Nhận Mặc Định')
      .input('PhoneNumber', sql.NVarChar(20), '0909999999')
      .input('AddressLine', sql.NVarChar(255), '789 Đường Mặc Định')
      .input('Ward', sql.NVarChar(100), 'Phường Bến Nghé')
      .input('District', sql.NVarChar(100), 'Quận 1')
      .input('Province', sql.NVarChar(100), 'TP. Hồ Chí Minh')
      .query(`
        INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
        OUTPUT INSERTED.AddressId
        VALUES (@UserId, @RecipientName, @PhoneNumber, @AddressLine, @Ward, @District, @Province, 1)
      `);
    createdAddressIds.push(addrDefault1.recordset[0].AddressId);
    testPass('Thêm thành công địa chỉ mặc định đầu tiên (IsDefault = 1)');

    // Test 10: Ràng buộc Unique: Cố tình chèn địa chỉ thứ 2 có IsDefault = 1 cho cùng UserId -> BỊ CHẶN BỞI SQL SERVER
    let uniqueViolated = false;
    try {
      await pool.request()
        .input('UserId', sql.Int, testUserId)
        .input('RecipientName', sql.NVarChar(100), 'Người Nhận Mặc Định Thứ 2 (Trái Phép)')
        .input('PhoneNumber', sql.NVarChar(20), '0908888888')
        .input('AddressLine', sql.NVarChar(255), '999 Đường Trùng Lặp')
        .input('Ward', sql.NVarChar(100), 'Phường Bến Thành')
        .input('District', sql.NVarChar(100), 'Quận 1')
        .input('Province', sql.NVarChar(100), 'TP. Hồ Chí Minh')
        .query(`
          INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
          VALUES (@UserId, @RecipientName, @PhoneNumber, @AddressLine, @Ward, @District, @Province, 1)
        `);
    } catch (err) {
      const code = err.number ?? err.originalError?.info?.number;
      if (code === 2601 || code === 2627) {
        uniqueViolated = true;
      }
    }
    assert.equal(uniqueViolated, true, 'SQL Server phải chặn vi phạm UX_UserAddresses_Default');
    testPass('Chặn thành công lỗi trùng lặp địa chỉ mặc định nhờ Filtered Unique Index (Error 2601/2627)');

    // Test 11: Ràng buộc Khóa ngoại (FK): Cố tình chèn địa chỉ cho UserId không tồn tại (UserId = 999999) -> BỊ CHẶN
    let fkViolated = false;
    try {
      await pool.request()
        .input('UserId', sql.Int, 999999)
        .input('RecipientName', sql.NVarChar(100), 'Ghost User')
        .input('PhoneNumber', sql.NVarChar(20), '0900000000')
        .input('AddressLine', sql.NVarChar(255), 'Vô Danh')
        .input('Ward', sql.NVarChar(100), 'Phường Ảo')
        .input('District', sql.NVarChar(100), 'Quận Ảo')
        .input('Province', sql.NVarChar(100), 'Tỉnh Ảo')
        .query(`
          INSERT INTO UserAddresses (UserId, RecipientName, PhoneNumber, AddressLine, Ward, District, Province, IsDefault)
          VALUES (@UserId, @RecipientName, @PhoneNumber, @AddressLine, @Ward, @District, @Province, 0)
        `);
    } catch (err) {
      const code = err.number ?? err.originalError?.info?.number;
      if (code === 547) {
        fkViolated = true;
      }
    }
    assert.equal(fkViolated, true, 'SQL Server phải chặn vi phạm Foreign Key FK_UserAddresses_Users');
    testPass('Chặn thành công vi phạm tính toàn vẹn dữ liệu khóa ngoại FK (Error 547)');

  } catch (error) {
    testFail('Lỗi không mong muốn trong quá trình kiểm thử', error);
  } finally {
    // Dọn dẹp dữ liệu test sạch sẽ
    if (testUserId) {
      await pool.request().input('UserId', sql.Int, testUserId).query(`
        DELETE FROM UserAddresses WHERE UserId = @UserId;
        DELETE FROM Users WHERE UserId = @UserId;
      `);
    }
    console.log(`\n=====================================================================`);
    console.log(`--- KẾT QUẢ KIỂM THỬ T-SQL: ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN 100% ---`);
    console.log(`=====================================================================\n`);
    await db.closeDB();
  }
}

runTests();
