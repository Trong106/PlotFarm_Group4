/**
 * ============================================================================
 * PLOTFARM PLATFORM — SEED DATA SCRIPT
 * Module: Quản lý Thông tin cá nhân & Sổ địa chỉ (User Profile & Addresses)
 * Mục tiêu: Khởi tạo 1 tài khoản Admin, 2 tài khoản Staff, 2 tài khoản Customer
 * Kèm theo địa chỉ mặc định (UserAddresses) tương ứng trong SQL Server
 * ============================================================================
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB, sql } = require('../src/config/db');
const { TABLES } = require('../src/models');

// ─── 1. DỮ LIỆU KHỞI TẠO (SEED CONFIG) ───────────────────────────────────────
const ROLES_DATA = [
  { name: 'Admin', description: 'Quản trị viên toàn quyền hệ thống' },
  { name: 'Staff', description: 'Kỹ thuật viên nông trại chăm sóc và đăng nhật ký' },
  { name: 'Customer', description: 'Khách hàng thuê đất và theo dõi mùa vụ' },
];

const USERS_DATA = [
  // ── 1 Tài khoản Admin ───────────────────────────────────────────────────
  {
    role: 'Admin',
    fullName: 'Quản Trị Viên PlotFarm',
    email: 'admin@plotfarm.vn',
    password: 'Admin@2026!',
    phoneNumber: '0901000001',
    status: 'ACTIVE',
    address: {
      label: 'Văn phòng chính',
      recipientName: 'Quản Trị Viên PlotFarm',
      phoneNumber: '0901000001',
      addressLine: '123 Đường Công Nghệ Cao',
      streetAddress: '123 Đường Công Nghệ Cao',
      ward: 'Phường Long Thạnh Mỹ',
      district: 'Thành phố Thủ Đức',
      province: 'Thành phố Hồ Chí Minh',
      isDefault: 1,
    },
  },

  // ── 2 Tài khoản Staff ───────────────────────────────────────────────────
  {
    role: 'Staff',
    fullName: 'Nguyễn Minh Khoa',
    email: 'khoa.staff@plotfarm.vn',
    password: 'Staff@2026!',
    phoneNumber: '0902000001',
    status: 'ACTIVE',
    address: {
      label: 'Trạm kỹ thuật Khu A',
      recipientName: 'Nguyễn Minh Khoa',
      phoneNumber: '0902000001',
      addressLine: 'Khu A - Trạm Kỹ Thuật Nông Trại PlotFarm',
      streetAddress: 'Khu A - Trạm Kỹ Thuật Nông Trại PlotFarm',
      ward: 'Phường Tân Phú',
      district: 'Thành phố Thủ Đức',
      province: 'Thành phố Hồ Chí Minh',
      isDefault: 1,
    },
  },
  {
    role: 'Staff',
    fullName: 'Trần Thị Hương',
    email: 'huong.staff@plotfarm.vn',
    password: 'Staff@2026!',
    phoneNumber: '0902000002',
    status: 'ACTIVE',
    address: {
      label: 'Vườn ươm Củ Chi Khu B',
      recipientName: 'Trần Thị Hương',
      phoneNumber: '0902000002',
      addressLine: 'Khu B - Vườn Ươm PlotFarm Củ Chi',
      streetAddress: 'Khu B - Vườn Ươm PlotFarm Củ Chi',
      ward: 'Xã An Nhơn Tây',
      district: 'Huyện Củ Chi',
      province: 'Thành phố Hồ Chí Minh',
      isDefault: 1,
    },
  },

  // ── 2 Tài khoản Customer ────────────────────────────────────────────────
  {
    role: 'Customer',
    fullName: 'Lê Văn Bình',
    email: 'binh.customer@plotfarm.vn',
    password: 'Customer@2026!',
    phoneNumber: '0903000001',
    status: 'ACTIVE',
    address: {
      label: 'Nhà riêng',
      recipientName: 'Lê Văn Bình',
      phoneNumber: '0903000001',
      addressLine: '45/2 Đường Nguyễn Huệ',
      streetAddress: '45/2 Đường Nguyễn Huệ',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'Thành phố Hồ Chí Minh',
      isDefault: 1,
    },
  },
  {
    role: 'Customer',
    fullName: 'Phạm Ngọc Lan',
    email: 'lan.customer@plotfarm.vn',
    password: 'Customer@2026!',
    phoneNumber: '0903000002',
    status: 'ACTIVE',
    address: {
      label: 'Nhà riêng',
      recipientName: 'Phạm Ngọc Lan',
      phoneNumber: '0903000002',
      addressLine: '88 Đường Lê Thánh Tôn',
      streetAddress: '88 Đường Lê Thánh Tôn',
      ward: 'Phường Bến Thành',
      district: 'Quận 1',
      province: 'Thành phố Hồ Chí Minh',
      isDefault: 1,
    },
  },
];

// ─── HELPER LOGGING ──────────────────────────────────────────────────────────
const log = (msg) => console.log(`  [OK]   ${msg}`);
const info = (msg) => console.log(`  [INFO] ${msg}`);
const warn = (msg) => console.log(`  [SKIP] ${msg}`);
const sep = () => console.log('  ' + '─'.repeat(70));

// ─── STEP 1: Seed Roles ──────────────────────────────────────────────────────
async function seedRoles(pool) {
  sep();
  console.log('  [BƯỚC 1] Khởi tạo Bảng Roles (Vai trò người dùng)...');

  for (const r of ROLES_DATA) {
    const check = await pool
      .request()
      .input('RoleName', sql.NVarChar(50), r.name)
      .query(`SELECT RoleId FROM ${TABLES.ROLES} WHERE RoleName = @RoleName`);

    if (check.recordset.length === 0) {
      const ins = await pool
        .request()
        .input('RoleName', sql.NVarChar(50), r.name)
        .input('Description', sql.NVarChar(255), r.description)
        .query(`
          INSERT INTO ${TABLES.ROLES} (RoleName, Description)
          OUTPUT INSERTED.RoleId
          VALUES (@RoleName, @Description)
        `);
      log(`Tạo vai trò [${r.name}] — RoleId: ${ins.recordset[0].RoleId}`);
    } else {
      warn(`Vai trò [${r.name}] đã tồn tại (RoleId: ${check.recordset[0].RoleId})`);
    }
  }
}

// ─── STEP 2: Seed Users ──────────────────────────────────────────────────────
async function seedUsers(pool) {
  sep();
  console.log('  [BƯỚC 2] Khởi tạo Bảng Users (1 Admin, 2 Staff, 2 Customer)...');
  const userResults = [];

  for (const item of USERS_DATA) {
    const roleRes = await pool
      .request()
      .input('RoleName', sql.NVarChar(50), item.role)
      .query(`SELECT RoleId FROM ${TABLES.ROLES} WHERE RoleName = @RoleName`);

    if (roleRes.recordset.length === 0) {
      console.error(`  [ERR] Không tìm thấy vai trò ${item.role} cho ${item.email}`);
      continue;
    }
    const roleId = roleRes.recordset[0].RoleId;

    const check = await pool
      .request()
      .input('Email', sql.NVarChar(150), item.email)
      .query(`SELECT UserId, FullName FROM ${TABLES.USERS} WHERE Email = @Email`);

    let userId;
    const passwordHash = await bcrypt.hash(item.password, 10);

    if (check.recordset.length === 0) {
      const ins = await pool
        .request()
        .input('RoleId', sql.Int, roleId)
        .input('FullName', sql.NVarChar(100), item.fullName)
        .input('Email', sql.NVarChar(150), item.email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('PhoneNumber', sql.NVarChar(20), item.phoneNumber)
        .input('Status', sql.NVarChar(30), item.status)
        .query(`
          INSERT INTO ${TABLES.USERS}
            (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
          OUTPUT INSERTED.UserId
          VALUES
            (@RoleId, @FullName, @Email, @PasswordHash, @PhoneNumber, @Status)
        `);
      userId = ins.recordset[0].UserId;
      log(`Tạo mới: [${item.role.padEnd(8)}] ${item.fullName} <${item.email}> (UserId: ${userId})`);
    } else {
      userId = check.recordset[0].UserId;
      await pool
        .request()
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .input('FullName', sql.NVarChar(100), item.fullName)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('PhoneNumber', sql.NVarChar(20), item.phoneNumber)
        .input('Status', sql.NVarChar(30), item.status)
        .query(`
          UPDATE ${TABLES.USERS}
          SET RoleId = @RoleId, FullName = @FullName, PasswordHash = @PasswordHash,
              PhoneNumber = @PhoneNumber, Status = @Status, UpdatedAt = SYSDATETIME()
          WHERE UserId = @UserId
        `);
      info(`Đã cập nhật: [${item.role.padEnd(8)}] ${item.fullName} <${item.email}> (UserId: ${userId})`);
    }

    userResults.push({ userId, ...item });
  }

  return userResults;
}

// ─── STEP 3: Seed UserAddresses ──────────────────────────────────────────────
async function seedAddresses(pool, users) {
  sep();
  console.log('  [BƯỚC 3] Khởi tạo Bảng UserAddresses (Sổ địa chỉ mặc định)...');

  // Kiểm tra cột có trong bảng UserAddresses
  const colsRes = await pool
    .request()
    .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${TABLES.USER_ADDRESSES}'`);
  const colNames = colsRes.recordset.map((c) => c.COLUMN_NAME);
  const hasLabel = colNames.includes('Label');
  const hasStreetAddress = colNames.includes('StreetAddress');
  const hasAddressLine = colNames.includes('AddressLine');

  for (const user of users) {
    if (!user.address) continue;
    const addr = user.address;

    const check = await pool
      .request()
      .input('UserId', sql.Int, user.userId)
      .query(`SELECT 1 AS ExistsFlag FROM ${TABLES.USER_ADDRESSES} WHERE UserId = @UserId`);

    if (check.recordset.length === 0) {
      const req = pool
        .request()
        .input('UserId', sql.Int, user.userId)
        .input('RecipientName', sql.NVarChar(100), addr.recipientName)
        .input('PhoneNumber', sql.NVarChar(20), addr.phoneNumber)
        .input('Ward', sql.NVarChar(100), addr.ward)
        .input('District', sql.NVarChar(100), addr.district)
        .input('Province', sql.NVarChar(100), addr.province)
        .input('IsDefault', sql.Bit, addr.isDefault ? 1 : 0);

      const insertCols = ['UserId', 'RecipientName', 'PhoneNumber', 'Ward', 'District', 'Province', 'IsDefault'];
      const insertVals = ['@UserId', '@RecipientName', '@PhoneNumber', '@Ward', '@District', '@Province', '@IsDefault'];

      if (hasAddressLine) {
        req.input('AddressLine', sql.NVarChar(255), addr.addressLine);
        insertCols.push('AddressLine');
        insertVals.push('@AddressLine');
      }

      if (hasLabel) {
        req.input('Label', sql.NVarChar(100), addr.label);
        insertCols.push('Label');
        insertVals.push('@Label');
      }

      if (hasStreetAddress) {
        req.input('StreetAddress', sql.NVarChar(255), addr.streetAddress);
        insertCols.push('StreetAddress');
        insertVals.push('@StreetAddress');
      }

      await req.query(`
        INSERT INTO ${TABLES.USER_ADDRESSES} (${insertCols.join(', ')})
        VALUES (${insertVals.join(', ')})
      `);

      log(`Thêm địa chỉ: User #${user.userId} (${user.email}) -> ${addr.addressLine}, ${addr.ward}, ${addr.province}`);
    } else {
      warn(`Địa chỉ User #${user.userId} (${user.email}) đã tồn tại — bỏ qua`);
    }
  }
}

// ─── STEP 4: Summary ─────────────────────────────────────────────────────────
async function printSummary(pool) {
  sep();
  console.log('  [BƯỚC 4] Bảng thống kê tài khoản trong Database:\n');

  const detail = await pool.request().query(`
    SELECT
      u.UserId,
      r.RoleName AS [Role],
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.Status,
      (SELECT COUNT(*) FROM ${TABLES.USER_ADDRESSES} a WHERE a.UserId = u.UserId) AS AddressCount
    FROM ${TABLES.USERS} u
    JOIN ${TABLES.ROLES} r ON u.RoleId = r.RoleId
    ORDER BY r.RoleName, u.UserId
  `);

  console.log('  ID  | Vai trò   | Họ tên                  | Email                         | SĐT          | Địa chỉ');
  console.log('  ' + '─'.repeat(95));
  for (const u of detail.recordset) {
    const id   = String(u.UserId).padEnd(3);
    const role = u.Role.padEnd(9);
    const name = (u.FullName || '').padEnd(24);
    const eml  = (u.Email || '').padEnd(30);
    const ph   = (u.PhoneNumber || 'N/A').padEnd(12);
    console.log(`  ${id} | ${role} | ${name} | ${eml} | ${ph} | ${u.AddressCount} địa chỉ`);
  }
}

// ─── MAIN RUNNER ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  PLOTFARM — SEED DỮ LIỆU KHỞI TẠO: ROLES, USERS & ADDRESSES');
  console.log(`  Database: ${process.env.DB_DATABASE || 'PlotFarmDB'} @ ${process.env.DB_SERVER || 'localhost'}`);
  console.log('='.repeat(80));

  let pool;
  try {
    pool = await connectDB();
    if (!pool) {
      console.error('  [LỖI] Không thể kết nối SQL Server. Vui lòng kiểm tra file .env');
      process.exit(1);
    }

    await seedRoles(pool);
    const users = await seedUsers(pool);
    await seedAddresses(pool, users);
    await printSummary(pool);

    sep();
    console.log('\n  [HOÀN THÀNH] Danh sách tài khoản đã sẵn sàng đăng nhập:\n');
    console.log('  Vai trò   | Email                           | Mật khẩu');
    console.log('  ' + '─'.repeat(60));
    for (const u of USERS_DATA) {
      console.log(`  ${u.role.padEnd(9)} | ${u.email.padEnd(32)} | ${u.password}`);
    }
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (err) {
    console.error('\n  [LỖI SEED]:', err);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

main();
