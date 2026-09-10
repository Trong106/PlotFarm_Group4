const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sql } = db;
const { TABLES } = require('../models');

const duplicateEmailError = () => {
  const error = new Error('Email này đã được sử dụng trong hệ thống');
  error.statusCode = 409;
  error.errors = [{ field: 'email', message: error.message }];
  return error;
};

const registerUser = async ({ fullName, email, password, phoneNumber }) => {
  const pool = db.getPool();

  // Check email existence
  const checkResult = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`SELECT UserId FROM ${TABLES.USERS} WHERE Email = @Email`);

  if (checkResult.recordset.length > 0) {
    throw duplicateEmailError();
  }

  // Resolve the seeded Customer role; never trust a role supplied by the client.
  const roleResult = await pool
    .request()
    .input('RoleName', sql.NVarChar(50), 'Customer')
    .query(`SELECT RoleId FROM ${TABLES.ROLES} WHERE RoleName = @RoleName`);
  
  if (roleResult.recordset.length === 0) {
    throw new Error('Customer role is missing. Run the roles/users schema seed first.');
  }
  const roleId = roleResult.recordset[0].RoleId;
  const passwordHash = await bcrypt.hash(password, 10);

  // The database UNIQUE constraint is the final guard for concurrent requests.
  let insertResult;
  try {
    insertResult = await pool
      .request()
      .input('RoleId', sql.Int, roleId)
      .input('FullName', sql.NVarChar(100), fullName)
      .input('Email', sql.NVarChar(150), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber || null)
      .query(`
        INSERT INTO ${TABLES.USERS} (RoleId, FullName, Email, PasswordHash, PhoneNumber, Status)
        OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.RoleId, INSERTED.CreatedAt
        VALUES (@RoleId, @FullName, @Email, @PasswordHash, @PhoneNumber, 'ACTIVE')
      `);
  } catch (error) {
    const sqlErrorNumber = error.number ?? error.originalError?.info?.number;
    if (sqlErrorNumber === 2601 || sqlErrorNumber === 2627) {
      throw duplicateEmailError();
    }
    throw error;
  }

  const user = insertResult.recordset[0];
  return {
    userId: user.UserId,
    fullName: user.FullName,
    email: user.Email,
    role: 'Customer',
    createdAt: user.CreatedAt,
  };
};

const loginUser = async ({ email, password }) => {
  const pool = db.getPool();

  const userResult = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT u.UserId, u.RoleId, r.RoleName, u.FullName, u.Email, u.PasswordHash, u.Status
      FROM ${TABLES.USERS} u
      JOIN ${TABLES.ROLES} r ON u.RoleId = r.RoleId
      WHERE u.Email = @Email
    `);

  if (userResult.recordset.length === 0) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const user = userResult.recordset[0];

  if (user.Status !== 'ACTIVE') {
    const error = new Error('Tài khoản đã bị tạm khóa hoặc chưa kích hoạt');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.PasswordHash);
  if (!isMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  // Create JWT Token
  const payload = {
    userId: user.UserId,
    email: user.Email,
    role: user.RoleName,
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'PlotFarm_Super_Secret_Key_2026_Team4',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      userId: user.UserId,
      fullName: user.FullName,
      email: user.Email,
      role: user.RoleName,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};
