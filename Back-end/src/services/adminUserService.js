const db = require('../config/db');
const { sql } = db;
const { TABLES } = require('../models');

const assertActiveAdmin = async (userId) => {
  if (!Number.isInteger(userId) || userId < 1 || userId > 2147483647) {
    throw Object.assign(new Error('Token không chứa mã người dùng hợp lệ'), { statusCode: 401 });
  }
  const result = await db.getPool().request().input('UserId', sql.Int, userId)
    .query(`SELECT u.Status, r.RoleName FROM ${TABLES.USERS} u
      JOIN ${TABLES.ROLES} r ON r.RoleId = u.RoleId WHERE u.UserId = @UserId`);
  const user = result.recordset[0];
  // Check live permissions: an old Admin JWT must not bypass a lock or role revocation.
  if (!user || user.Status !== 'ACTIVE' || user.RoleName !== 'Admin') {
    throw Object.assign(new Error('Chỉ Admin đang hoạt động mới được xem danh sách người dùng'), { statusCode: 403 });
  }
};

const listUsers = async ({ page, limit, search }) => {
  // Escape LIKE metacharacters as literals as well as parameterizing SQL values.
  const pattern = search ? `%${search.replace(/[~%_\[]/g, (character) => `~${character}`)}%` : null;
  const source = `FROM ${TABLES.USERS} u JOIN ${TABLES.ROLES} r ON r.RoleId = u.RoleId
    WHERE (@Search IS NULL OR u.FullName LIKE @Search ESCAPE N'~'
      OR u.Email LIKE @Search ESCAPE N'~' OR u.PhoneNumber LIKE @Search ESCAPE N'~')`;
  const result = await db.getPool().request()
    .input('Search', sql.NVarChar(302), pattern)
    .input('Offset', sql.Int, (page - 1) * limit)
    .input('Limit', sql.Int, limit)
    .query(`SELECT COUNT(*) AS Total ${source};
      SELECT u.UserId, u.FullName, u.Email, u.PhoneNumber, u.AvatarUrl,
        u.RoleId, r.RoleName, u.Status, u.CreatedAt, u.UpdatedAt ${source}
      ORDER BY u.CreatedAt DESC, u.UserId DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;`);
  const total = result.recordsets[0][0].Total;
  const totalPages = Math.ceil(total / limit);
  return {
    users: result.recordsets[1].map((user) => ({
      userId: user.UserId, fullName: user.FullName, email: user.Email,
      phoneNumber: user.PhoneNumber, avatarUrl: user.AvatarUrl,
      roleId: user.RoleId, role: user.RoleName, status: user.Status,
      createdAt: user.CreatedAt, updatedAt: user.UpdatedAt,
    })),
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  };
};

module.exports = { assertActiveAdmin, listUsers };
