const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { TABLES } = require('../models');
const { generateToken } = require('../utils/jwtHelper');

const registerUser = async ({ fullName, email, password, phoneNumber }) => {
  const pool = getPool();

  // Check email existence
  const checkResult = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`SELECT UserId FROM ${TABLES.USERS} WHERE Email = @Email`);

  if (checkResult.recordset.length > 0) {
    const error = new Error('Email này đã được sử dụng trong hệ thống');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Default Role: Customer (RoleId = 3)
  const roleResult = await pool
    .request()
    .input('RoleName', sql.NVarChar(50), 'Customer')
    .query(`SELECT RoleId, RoleName FROM ${TABLES.ROLES} WHERE RoleName = @RoleName`);
  
  const roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleId : 3;

  // Insert User
  const insertResult = await pool
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

  const newUser = insertResult.recordset[0];

  // Lấy tên role để đưa vào payload token
  const roleName = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleName : 'Customer';

  // Tạo và ký JWT token ngay sau đăng ký (payload: userId, role)
  const token = generateToken({
    userId: newUser.UserId,
    role: roleName,
    email: newUser.Email,
  });

  return {
    token,
    user: {
      userId: newUser.UserId,
      fullName: newUser.FullName,
      email: newUser.Email,
      roleId: newUser.RoleId,
      role: roleName,
      createdAt: newUser.CreatedAt,
    },
  };
};

const loginUser = async ({ email, password }) => {
  const pool = getPool();

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

  // Tạo và ký JWT token (payload: userId, role) — dùng generateToken từ jwtHelper
  const token = generateToken({
    userId: user.UserId,
    role: user.RoleName,
    email: user.Email,
  });

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
