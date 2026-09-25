const { sql } = require('../config/db');

// Use the caller's transaction: never announce an activity that was not saved.
const notifyCareActivity = async (transaction, cultivationId, title) => {
  await transaction.request()
    .input('CultivationId', sql.Int, cultivationId)
    .input('Title', sql.NVarChar(150), 'Vườn của bạn có hoạt động chăm sóc mới')
    .input('Message', sql.NVarChar(sql.MAX), title)
    .query(`
      INSERT INTO Notifications (UserId, Title, Message, Type, RelatedId, IsRead, CreatedAt)
      SELECT ro.UserId, @Title, CONCAT(p.PlotCode, N': ', @Message),
             'CARE_UPDATE', c.CultivationId, 0, SYSDATETIME()
      FROM Cultivations c
      INNER JOIN RentalOrders ro ON ro.OrderId = c.OrderId
      INNER JOIN Plots p ON p.PlotId = c.PlotId
      WHERE c.CultivationId = @CultivationId
    `);
};

module.exports = { notifyCareActivity };
