const db = require('../config/db');
const { sql } = db;
const { TABLES } = require('../models');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const profileColumns = ['UserId', 'FullName', 'Email', 'PhoneNumber', 'AvatarUrl', 'RoleId', 'Status', 'CreatedAt', 'UpdatedAt'];
const addressColumns = ['AddressId', 'UserId', 'RecipientName', 'PhoneNumber', 'AddressLine', 'Ward', 'District', 'Province', 'IsDefault', 'CreatedAt', 'UpdatedAt'];
const toJson = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
  key[0].toLowerCase() + key.slice(1), key === 'IsDefault' ? Boolean(value) : value,
]));
const outputColumns = (columns, alias = 'INSERTED') => columns.map((column) => `${alias}.${column}`).join(', ');
const profileFields = {
  fullName: ['FullName', sql.NVarChar(100)], email: ['Email', sql.NVarChar(150)],
  phoneNumber: ['PhoneNumber', sql.NVarChar(20)], avatarUrl: ['AvatarUrl', sql.NVarChar(500)],
};
const addressFields = {
  recipientName: ['RecipientName', sql.NVarChar(100)], phoneNumber: ['PhoneNumber', sql.NVarChar(20)],
  addressLine: ['AddressLine', sql.NVarChar(255)], ward: ['Ward', sql.NVarChar(100)],
  district: ['District', sql.NVarChar(100)], province: ['Province', sql.NVarChar(100)],
  isDefault: ['IsDefault', sql.Bit],
};
// Column names come only from this server-side allowlist; values are SQL parameters.
const bindUpdates = (request, fields, data) => Object.entries(fields)
  .filter(([key]) => data[key] !== undefined)
  .map(([key, [column, type]]) => {
    request.input(column, type, data[key]);
    return `${column} = @${column}`;
  });

const getProfile = async (userId) => {
  const result = await db.getPool().request().input('UserId', sql.Int, userId)
    .query(`SELECT ${profileColumns.join(', ')} FROM ${TABLES.USERS} WHERE UserId = @UserId`);
  if (!result.recordset.length) throw httpError(404, 'Không tìm thấy người dùng');
  return toJson(result.recordset[0]);
};

const updateProfile = async (userId, data) => {
  const request = db.getPool().request().input('UserId', sql.Int, userId);
  const updates = bindUpdates(request, profileFields, data);
  try {
    const result = await request.query(`UPDATE ${TABLES.USERS}
      SET ${updates.join(', ')}, UpdatedAt = SYSDATETIME()
      OUTPUT ${outputColumns(profileColumns)} WHERE UserId = @UserId`);
    if (!result.recordset.length) throw httpError(404, 'Không tìm thấy người dùng');
    return toJson(result.recordset[0]);
  } catch (error) {
    const number = error.number ?? error.originalError?.info?.number;
    if (number === 2601 || number === 2627) {
      throw Object.assign(httpError(409, 'Email này đã được sử dụng trong hệ thống'), {
        errors: [{ field: 'email', message: 'Email này đã được sử dụng trong hệ thống' }],
      });
    }
    throw error;
  }
};

const listAddresses = async (userId) => {
  const result = await db.getPool().request().input('UserId', sql.Int, userId)
    .query(`SELECT ${addressColumns.join(', ')} FROM ${TABLES.USER_ADDRESSES}
      WHERE UserId = @UserId ORDER BY IsDefault DESC, AddressId DESC`);
  return result.recordset.map(toJson);
};

const getAddress = async (userId, addressId, connection = db.getPool()) => {
  const result = await connection.request().input('UserId', sql.Int, userId).input('AddressId', sql.Int, addressId)
    .query(`SELECT ${addressColumns.join(', ')} FROM ${TABLES.USER_ADDRESSES}
      WHERE UserId = @UserId AND AddressId = @AddressId`);
  if (!result.recordset.length) throw httpError(404, 'Không tìm thấy địa chỉ');
  return toJson(result.recordset[0]);
};

// Serialize address writes for each owner, including when their address book is empty.
const withAddressTransaction = async (userId, action) => {
  const transaction = db.getPool().transaction();
  await transaction.begin();
  try {
    const owner = await transaction.request().input('UserId', sql.Int, userId)
      .query(`SELECT UserId, Status FROM ${TABLES.USERS} WITH (UPDLOCK, HOLDLOCK) WHERE UserId = @UserId`);
    if (!owner.recordset.length) throw httpError(404, 'Không tìm thấy người dùng');
    if (owner.recordset[0].Status !== 'ACTIVE') throw httpError(403, 'Tài khoản đã bị khóa hoặc chưa kích hoạt');
    const result = await action(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try { await transaction.rollback(); } catch { /* Preserve the original database error. */ }
    throw error;
  }
};

const clearDefault = (transaction, userId) => transaction.request().input('UserId', sql.Int, userId)
  .query(`UPDATE ${TABLES.USER_ADDRESSES} SET IsDefault = 0, UpdatedAt = SYSDATETIME()
    WHERE UserId = @UserId AND IsDefault = 1`);

const createAddress = (userId, data) => withAddressTransaction(userId, async (transaction) => {
  if (data.isDefault) await clearDefault(transaction, userId);
  const request = transaction.request().input('UserId', sql.Int, userId);
  const values = { ...data, district: data.district ?? null, isDefault: data.isDefault ?? false };
  bindUpdates(request, addressFields, values);
  const columns = Object.values(addressFields).map(([column]) => column);
  const result = await request.query(`INSERT INTO ${TABLES.USER_ADDRESSES} (UserId, ${columns.join(', ')})
    OUTPUT ${outputColumns(addressColumns)} VALUES (@UserId, ${columns.map((column) => `@${column}`).join(', ')})`);
  return toJson(result.recordset[0]);
});

const updateAddress = (userId, addressId, data) => withAddressTransaction(userId, async (transaction) => {
  // Verify ownership before changing any default flags.
  await getAddress(userId, addressId, transaction);
  if (data.isDefault) await clearDefault(transaction, userId);
  const request = transaction.request().input('UserId', sql.Int, userId).input('AddressId', sql.Int, addressId);
  const updates = bindUpdates(request, addressFields, data);
  const result = await request.query(`UPDATE ${TABLES.USER_ADDRESSES} SET ${updates.join(', ')}, UpdatedAt = SYSDATETIME()
    OUTPUT ${outputColumns(addressColumns)} WHERE UserId = @UserId AND AddressId = @AddressId`);
  if (!result.recordset.length) throw httpError(404, 'Không tìm thấy địa chỉ');
  return toJson(result.recordset[0]);
});

const deleteAddress = (userId, addressId) => withAddressTransaction(userId, async (transaction) => {
  try {
    const result = await transaction.request().input('UserId', sql.Int, userId).input('AddressId', sql.Int, addressId)
      .query(`DELETE FROM ${TABLES.USER_ADDRESSES} OUTPUT DELETED.AddressId
        WHERE UserId = @UserId AND AddressId = @AddressId`);
    if (!result.recordset.length) throw httpError(404, 'Không tìm thấy địa chỉ');
    return null;
  } catch (error) {
    if ((error.number ?? error.originalError?.info?.number) === 547) {
      throw httpError(409, 'Địa chỉ đang được sử dụng và không thể xóa');
    }
    throw error;
  }
});

module.exports = { getProfile, updateProfile, listAddresses, getAddress, createAddress, updateAddress, deleteAddress };
