// Run manually against local test data: node scripts/test-mock-checkout-sql.js
// All checkout writes are rolled back; no order/payment/plot change is committed.
const assert = require('node:assert/strict');
const db = require('../src/config/db');

async function main() {
  const OriginalTransaction = db.sql.Transaction;
  const rollbackOnly = new Error('CHECKOUT_TEST_ROLLBACK');
  try {
    const pool = await db.connectDB();
    if (!pool) throw new Error('Database unavailable');
    const { recordset: [fixture] } = await pool.request().query(`
      SELECT
        (SELECT TOP (1) UserId FROM Users u JOIN Roles r ON r.RoleId=u.RoleId WHERE r.RoleName='Customer' AND u.Status='ACTIVE') AS UserId,
        (SELECT TOP (1) PlotId FROM Plots WHERE Status='AVAILABLE') AS PlotId,
        (SELECT TOP (1) s.SeedId FROM Seeds s WHERE s.IsAvailable=1 AND NOT EXISTS
          (SELECT 1 FROM GrowthStages gs WHERE gs.SeedId=s.SeedId)) AS SeedId,
        (SELECT TOP (1) PackageId FROM CarePackages WHERE IsActive=1) AS PackageId
    `);
    if (Object.values(fixture).some(value => !value)) {
      throw new Error('Requires a Customer, available plot/package and seed without growth stages in the local test database.');
    }
    const service = require('../src/services/orderService');
    for (const withStages of [false, true]) {
      let checked = false;
      let rolledBack = false;
      db.sql.Transaction = class extends OriginalTransaction {
        async begin() {
          await super.begin();
          if (withStages) {
            // Insert later stage first: checkout must use StageOrder, not a fixed ID.
            await this.request().input('SeedId', db.sql.Int, fixture.SeedId).query(`
              INSERT GrowthStages (SeedId,StageOrder,StageName,DurationDays)
              VALUES (@SeedId,2,N'CHECKOUT TEST later stage',10),
                     (@SeedId,1,N'CHECKOUT TEST first stage',5)
            `);
          }
        }
        async commit() {
          // Inspect the real SQL writes at the commit boundary, then force rollback.
          const { recordset: [row] } = await this.request()
            .input('PlotId', db.sql.Int, fixture.PlotId)
            .input('SeedId', db.sql.Int, fixture.SeedId)
            .query(`SELECT TOP (1) c.CurrentStageId, p.Status AS PlotStatus, ro.Status AS OrderStatus,
              (SELECT TOP (1) StageId FROM GrowthStages WHERE SeedId=@SeedId ORDER BY StageOrder,StageId) ExpectedStageId,
              (SELECT COUNT(*) FROM Payments pay WHERE pay.OrderId=ro.OrderId AND pay.Status='SUCCESS') PaymentCount,
              (SELECT COUNT(*) FROM OrderDetails od WHERE od.OrderId=ro.OrderId) DetailCount
              FROM Cultivations c JOIN RentalOrders ro ON ro.OrderId=c.OrderId
              JOIN Plots p ON p.PlotId=c.PlotId WHERE c.PlotId=@PlotId ORDER BY c.CultivationId DESC`);
          assert.ok(row);
          assert.equal(row.CurrentStageId, row.ExpectedStageId);
          if (!withStages) assert.equal(row.CurrentStageId, null);
          else assert.ok(row.CurrentStageId > 0);
          assert.equal(row.PlotStatus, 'RENTED');
          assert.equal(row.OrderStatus, 'PAID');
          assert.equal(row.PaymentCount, 1);
          assert.equal(row.DetailCount, 3);
          checked = true;
          throw rollbackOnly;
        }
        async rollback() { await super.rollback(); rolledBack = true; }
      };
      try {
        await service.createMockCheckout(fixture.UserId, {
          plotId: fixture.PlotId, seedId: fixture.SeedId, carePackageId: fixture.PackageId,
          cycles: 1, paymentMethod: 'MOMO',
        });
        assert.fail('Test must never commit');
      } catch (error) {
        if (error !== rollbackOnly) throw error;
      }
      assert.ok(checked && rolledBack);
      console.log(`PASS: checkout ${withStages ? 'selects the seed first stage' : 'accepts missing growth stages'}; all writes rolled back.`);
    }
  } finally {
    db.sql.Transaction = OriginalTransaction;
    await db.closeDB();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
