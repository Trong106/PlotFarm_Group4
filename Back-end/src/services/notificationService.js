const { getPool, sql } = require('../config/db');

/**
 * Lấy danh sách thông báo của người dùng (mới nhất lên đầu)
 */
const getMyNotifications = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT NotificationId, UserId, Title, Message, Type, RelatedId, IsRead, CreatedAt
      FROM Notifications
      WHERE UserId = @UserId
      ORDER BY CreatedAt DESC
    `);
  return result.recordset;
};

/**
 * Lấy số lượng thông báo chưa đọc của người dùng
 */
const getUnreadCount = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT COUNT(*) as unreadCount
      FROM Notifications
      WHERE UserId = @UserId AND IsRead = 0
    `);
  return result.recordset[0]?.unreadCount || 0;
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
const markAsRead = async (notificationId, userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('NotificationId', sql.Int, notificationId)
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET IsRead = 1
      OUTPUT INSERTED.*
      WHERE NotificationId = @NotificationId AND UserId = @UserId
    `);

  if (result.recordset.length === 0) {
    const err = new Error('Không tìm thấy thông báo hoặc bạn không có quyền truy cập');
    err.statusCode = 404;
    throw err;
  }

  return result.recordset[0];
};

/**
 * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
 */
const markAllAsRead = async (userId) => {
  const pool = getPool();
  await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET IsRead = 1
      WHERE UserId = @UserId AND IsRead = 0
    `);

  return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
};

/**
 * Tạo một thông báo mới cho người dùng
 */
const createNotification = async ({ userId, title, message, type = 'GENERAL', relatedId = null }) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('Title', sql.NVarChar(150), title)
    .input('Message', sql.NVarChar(sql.MAX), message)
    .input('Type', sql.NVarChar(50), type)
    .input('RelatedId', sql.Int, relatedId)
    .query(`
      INSERT INTO Notifications (UserId, Title, Message, Type, RelatedId, IsRead, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@UserId, @Title, @Message, @Type, @RelatedId, 0, SYSDATETIME())
    `);
  return result.recordset[0];
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};

