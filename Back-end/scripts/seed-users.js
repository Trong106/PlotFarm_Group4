/**
 * @file seed-users.js
 * @description Script chen du lieu khoi tao (Seed Data) vao PlotFarmDB - Microsoft SQL Server
 *
 * Du lieu duoc tao:
 *   Roles  : Admin, Staff, Customer (idempotent - khong tao trung)
 *   Users  : 1 Admin + 2 Staff + 2 Customer
 *   Addresses: 1 dia chi mac dinh cho moi User
 *
 * Cach chay:
 *   npm run seed
 *   hoac: node scripts/seed-users.js
 *
 * Script an toan: dung MERGE (upsert) - khong xoa du lieu hien co.
 * Chay lai nhieu lan khong gay loi hoac du lieu trung.
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const { connectDB, closeDB, sql } = require("../src/config/db");
const { TABLES } = require("../src/models");

// ─── Cau hinh Seed Data ───────────────────────────────────────────────────────

const SEED_ROLES = [
  { name: "Admin",    description: "Quan tri vien he thong PlotFarm, toan quyen quan ly" },
  { name: "Staff",    description: "Nhan vien ky thuat, ho tro canh tac va cham soc o dat" },
  { name: "Customer", description: "Khach hang thue o dat nong trai va su dung dich vu" },
];

const SEED_USERS = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    role: "Admin",
    fullName: "Quan Tri Vien PlotFarm",
    email: "admin@plotfarm.vn",
    password: "Admin@2026!",
    phoneNumber: "0901000001",
    status: "ACTIVE",
    address: {
      label: "Tru so chinh",
      recipientName: "Quan Tri Vien PlotFarm",
      phoneNumber: "0901000001",
      province: "Thanh pho Ho Chi Minh",
      district: "Quan 1",
      ward: "Phuong Ben Nghe",
      streetAddress: "123 Nguyen Hue",
      isDefault: true,
    },
  },

  // ── Staff ──────────────────────────────────────────────────────────────────
  {
    role: "Staff",
    fullName: "Nguyen Minh Khoa",
    email: "khoa.staff@plotfarm.vn",
    password: "Staff@2026!",
    phoneNumber: "0902000001",
    status: "ACTIVE",
    address: {
      label: "Nha rieng",
      recipientName: "Nguyen Minh Khoa",
      phoneNumber: "0902000001",
      province: "Thanh pho Ho Chi Minh",
      district: "Quan Binh Thanh",
      ward: "Phuong 25",
      streetAddress: "47 Xo Viet Nghe Tinh",
      isDefault: true,
    },
  },
  {
    role: "Staff",
    fullName: "Tran Thi Huong",
    email: "huong.staff@plotfarm.vn",
    password: "Staff@2026!",
    phoneNumber: "0902000002",
    status: "ACTIVE",
    address: {
      label: "Nha rieng",
      recipientName: "Tran Thi Huong",
      phoneNumber: "0902000002",
      province: "Thanh pho Ho Chi Minh",
      district: "Quan Thu Duc",
      ward: "Phuong Linh Trung",
      streetAddress: "89 Vo Van Ngan",
      isDefault: true,
    },
  },

  // ── Customer ──────────────────────────────────────────────────────────────
  {
    role: "Customer",
    fullName: "Le Van Binh",
    email: "binh.customer@plotfarm.vn",
    password: "Customer@2026!",
    phoneNumber: "0903000001",
    status: "ACTIVE",
    address: {
      label: "Nha rieng",
      recipientName: "Le Van Binh",
      phoneNumber: "0903000001",
      province: "Thanh pho Ho Chi Minh",
      district: "Quan 7",
      ward: "Phuong Tan Phu",
      streetAddress: "12 Nguyen Thi Thap",
      isDefault: true,
    },
  },
  {
    role: "Customer",
    fullName: "Pham Ngoc Lan",
    email: "lan.customer@plotfarm.vn",
    password: "Customer@2026!",
    phoneNumber: "0903000002",
    status: "ACTIVE",
    address: {
      label: "Dia chi nhan hang",
      recipientName: "Pham Ngoc Lan",
      phoneNumber: "0903000002",
      province: "Thanh pho Ho Chi Minh",
      district: "Quan 9",
      ward: "Phuong Long Thanh My",
      streetAddress: "56 Do Xuan Hop",
      isDefault: true,
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log("  [OK]  " + msg);
const warn = (msg) => console.log("  [SKIP]" + msg);
const sep  = ()    => console.log("-".repeat(60));

// ─── STEP 1: Seed Roles ───────────────────────────────────────────────────────
async function seedRoles(pool) {
  sep();
  console.log("[STEP 1] Khoi tao Roles...");
  for (const role of SEED_ROLES) {
    const result = await pool
      .request()
      .input("RoleName",    sql.NVarChar(50),  role.name)
      .input("Description", sql.NVarChar(255), role.description)
      .query(`
        MERGE INTO ${TABLES.ROLES} AS target
        USING (SELECT @RoleName AS RoleName) AS source
        ON target.RoleName = source.RoleName
        WHEN NOT MATCHED THEN
          INSERT (RoleName, Description) VALUES (@RoleName, @Description)
        WHEN MATCHED THEN
          UPDATE SET Description = @Description
        OUTPUT $action AS MergeAction, INSERTED.RoleId, INSERTED.RoleName;
      `);
    const row = result.recordset[0];
    if (row && row.MergeAction === "INSERT") {
      log("Role [" + role.name + "] da duoc tao moi (RoleId: " + row.RoleId + ")");
    } else {
      warn("Role [" + role.name + "] da ton tai — cap nhat description");
    }
  }
}

// ─── STEP 2: Seed Users ───────────────────────────────────────────────────────
async function seedUsers(pool) {
  sep();
  console.log("[STEP 2] Khoi tao Users...");
  const createdUsers = [];

  for (const userData of SEED_USERS) {
    const roleResult = await pool
      .request()
      .input("RoleName", sql.NVarChar(50), userData.role)
      .query("SELECT RoleId FROM " + TABLES.ROLES + " WHERE RoleName = @RoleName");

    if (roleResult.recordset.length === 0) {
      warn(" Khong tim thay role [" + userData.role + "] — bo qua: " + userData.email);
      continue;
    }
    const roleId = roleResult.recordset[0].RoleId;

    const existCheck = await pool
      .request()
      .input("Email", sql.NVarChar(150), userData.email)
      .query("SELECT UserId, FullName FROM " + TABLES.USERS + " WHERE Email = @Email");

    if (existCheck.recordset.length > 0) {
      const ex = existCheck.recordset[0];
      warn(" User [" + userData.email + "] da ton tai (UserId: " + ex.UserId + ") — bo qua");
      createdUsers.push({ userId: ex.UserId, ...userData });
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const insertResult = await pool
      .request()
      .input("RoleId",       sql.Int,          roleId)
      .input("FullName",     sql.NVarChar(100), userData.fullName)
      .input("Email",        sql.NVarChar(150), userData.email)
      .input("PasswordHash", sql.NVarChar(255), passwordHash)
      .input("PhoneNumber",  sql.NVarChar(20),  userData.phoneNumber || null)
      .input("Status",       sql.NVarChar(20),  userData.status)
      .query(`
        INSERT INTO ${TABLES.USERS}
          (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        OUTPUT
          INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.CreatedAt
        VALUES
          (@RoleId, @FullName, @Email, @PasswordHash, @PhoneNumber, @Status)
      `);

    const newUser = insertResult.recordset[0];
    log("[" + userData.role + "] " + newUser.FullName + " <" + newUser.Email + "> — UserId: " + newUser.UserId);
    createdUsers.push({ userId: newUser.UserId, ...userData });
  }

  return createdUsers;
}

// ─── STEP 3: Seed UserAddresses ──────────────────────────────────────────────
async function seedAddresses(pool, users) {
  sep();
  console.log("[STEP 3] Khoi tao UserAddresses...");

  for (const user of users) {
    if (!user.address) continue;
    const addr = user.address;

    const existCheck = await pool
      .request()
      .input("UserId", sql.Int, user.userId)
      .query("SELECT UserAddressId FROM " + TABLES.USER_ADDRESSES + " WHERE UserId = @UserId");

    if (existCheck.recordset.length > 0) {
      warn(" User #" + user.userId + " (" + user.email + ") da co dia chi — bo qua");
      continue;
    }

    await pool
      .request()
      .input("UserId",        sql.Int,          user.userId)
      .input("Label",         sql.NVarChar(100), addr.label || null)
      .input("RecipientName", sql.NVarChar(100), addr.recipientName)
      .input("PhoneNumber",   sql.NVarChar(20),  addr.phoneNumber || null)
      .input("Province",      sql.NVarChar(100), addr.province)
      .input("District",      sql.NVarChar(100), addr.district)
      .input("Ward",          sql.NVarChar(100), addr.ward)
      .input("StreetAddress", sql.NVarChar(255), addr.streetAddress)
      .input("IsDefault",     sql.Bit,           addr.isDefault ? 1 : 0)
      .query(`
        INSERT INTO ${TABLES.USER_ADDRESSES}
          (UserId, Label, RecipientName, PhoneNumber, Province, District, Ward, StreetAddress, IsDefault)
        VALUES
          (@UserId, @Label, @RecipientName, @PhoneNumber, @Province, @District, @Ward, @StreetAddress, @IsDefault)
      `);

    log("Dia chi [" + addr.label + "] -> User #" + user.userId + " (" + user.email + ")");
  }
}

// ─── STEP 4: Summary ─────────────────────────────────────────────────────────
async function printSummary(pool) {
  sep();
  console.log("[STEP 4] Tom tat du lieu sau seed:\n");

  const roleStats = await pool.request().query(`
    SELECT r.RoleName, COUNT(u.UserId) AS SoLuong
    FROM ${TABLES.ROLES} r
    LEFT JOIN ${TABLES.USERS} u ON r.RoleId = u.RoleId
    GROUP BY r.RoleName
    ORDER BY r.RoleName
  `);

  console.log("  Vai tro    | So luong");
  console.log("  ────────────────────");
  for (const row of roleStats.recordset) {
    console.log("  " + row.RoleName.padEnd(10) + " | " + row.SoLuong);
  }

  const detail = await pool.request().query(`
    SELECT
      u.UserId, r.RoleName AS Role, u.FullName, u.Email, u.PhoneNumber, u.Status,
      (SELECT COUNT(*) FROM ${TABLES.USER_ADDRESSES} a WHERE a.UserId = u.UserId) AS DiaChiCount
    FROM ${TABLES.USERS} u
    JOIN ${TABLES.ROLES} r ON u.RoleId = r.RoleId
    ORDER BY r.RoleName, u.UserId
  `);

  console.log("\n  ID  | Vai tro   | Ho ten                  | Email                         | SDT          | DC");
  console.log("  ─────────────────────────────────────────────────────────────────────────────────────────────");
  for (const u of detail.recordset) {
    const id   = String(u.UserId).padEnd(3);
    const role = u.Role.padEnd(9);
    const name = (u.FullName || "").padEnd(24);
    const eml  = (u.Email || "").padEnd(30);
    const ph   = (u.PhoneNumber || "N/A").padEnd(12);
    console.log("  " + id + " | " + role + " | " + name + " | " + eml + " | " + ph + " | " + u.DiaChiCount);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function runSeed() {
  console.log("\n" + "=".repeat(60));
  console.log("  PlotFarm — Seed Data Script (Users & Addresses)");
  console.log("  Database: " + (process.env.DB_DATABASE || "PlotFarmDB") + " @ " + (process.env.DB_SERVER || "localhost"));
  console.log("=".repeat(60));

  let pool;
  try {
    pool = await connectDB();
    if (!pool) {
      console.error("  [ERROR] Ket noi SQL Server that bai. Kiem tra lai file .env");
      process.exit(1);
    }
    console.log("\n  [OK] Da ket noi SQL Server thanh cong!\n");

    await seedRoles(pool);
    const seededUsers = await seedUsers(pool);
    await seedAddresses(pool, seededUsers);
    await printSummary(pool);

    sep();
    console.log("\n  [DONE] Seed hoan thanh! Tai khoan duoc tao:\n");
    console.log("  Vai tro   | Email                           | Mat khau");
    console.log("  ──────────────────────────────────────────────────────────");
    for (const acc of SEED_USERS) {
      console.log("  " + acc.role.padEnd(9) + " | " + acc.email.padEnd(32) + " | " + acc.password);
    }
    console.log("\n  [CAUTION] Thay doi mat khau ngay sau khi trien khai production!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n  [ERROR] Loi trong qua trinh seed:", error.message);
    if (error.message.includes("Invalid object name")) {
      console.error("  [HINT] Bang chua duoc tao. Hay chay migration SQL script truoc.");
    }
    if (error.message.includes("Login failed")) {
      console.error("  [HINT] Kiem tra DB_USER, DB_PASSWORD trong file .env");
    }
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

runSeed();
