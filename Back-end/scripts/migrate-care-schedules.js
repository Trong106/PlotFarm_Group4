/**
 * Database Migration Script: CareSchedules table + Performance Indexes
 * PlotFarm Team 4
 */
require('dotenv').config();
const { connectDB, closeDB, sql } = require('../src/config/db');


async function runMigration() {
  // Khởi tạo kết nối DB trước
  const pool = await connectDB();
  if (!pool) {
    console.error('[Migration] ❌ Không thể kết nối SQL Server!');
    process.exit(1);
  }

  let ok = 0, skip = 0, fail = 0;


  // ── 1. Tạo bảng CareSchedules ──────────────────────────────────────────────
  try {
    const existing = await pool.request().query(
      `SELECT 1 FROM sys.tables WHERE name = 'CareSchedules'`
    );

    if (existing.recordset.length === 0) {
      // Kiểm tra bảng cha có tồn tại không
      const cultivationsExists = await pool.request().query(
        `SELECT 1 FROM sys.tables WHERE name = 'Cultivations'`
      );
      const usersExists = await pool.request().query(
        `SELECT 1 FROM sys.tables WHERE name = 'Users'`
      );

      // Tạo bảng với FK constraint chỉ khi bảng cha tồn tại
      let createSQL = `
        CREATE TABLE dbo.CareSchedules (
          CareScheduleId  INT IDENTITY(1,1) CONSTRAINT PK_CareSchedules PRIMARY KEY,
          CultivationId   INT NOT NULL,
          PackageId       INT NULL,
          ActivityType    NVARCHAR(50)  NOT NULL,
          ScheduledDate   DATE          NOT NULL,
          Notes           NVARCHAR(255) NULL,
          Status          NVARCHAR(30)  NOT NULL CONSTRAINT DF_CareSchedules_Status DEFAULT 'PENDING',
          AssignedStaffId INT NULL,
          CompletedAt     DATETIME2(0)  NULL,
          ResultNote      NVARCHAR(500) NULL,
          ResultImageUrl  NVARCHAR(500) NULL,
          CreatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_CareSchedules_CreatedAt DEFAULT SYSDATETIME(),
          CONSTRAINT CK_CareSchedules_Status CHECK (Status IN ('PENDING','COMPLETED','SKIPPED')),
          CONSTRAINT CK_CareSchedules_ActivityType CHECK (ActivityType IN ('WATERING','FERTILIZING','PRUNING','PEST_CONTROL','SOIL_TEST'))
        )`;

      await pool.request().query(createSQL);

      // Thêm FK riêng nếu bảng cha tồn tại
      if (cultivationsExists.recordset.length > 0) {
        await pool.request().query(`
          ALTER TABLE dbo.CareSchedules
          ADD CONSTRAINT FK_CareSchedules_Cultivations
          FOREIGN KEY (CultivationId) REFERENCES dbo.Cultivations(CultivationId) ON DELETE CASCADE
        `);
      }
      if (usersExists.recordset.length > 0) {
        await pool.request().query(`
          ALTER TABLE dbo.CareSchedules
          ADD CONSTRAINT FK_CareSchedules_Staff
          FOREIGN KEY (AssignedStaffId) REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
        `);
      }

      console.log('[Migration] ✅ CareSchedules table: CREATED');
      ok++;
    } else {

      // Migration-safe: bổ sung cột nếu thiếu
      const colCheck = await pool.request().query(
        `SELECT COL_LENGTH('dbo.CareSchedules','ResultImageUrl') AS len`
      );
      if (!colCheck.recordset[0].len) {
        await pool.request().query(
          `ALTER TABLE dbo.CareSchedules ADD ResultImageUrl NVARCHAR(500) NULL`
        );
        console.log('[Migration] ✅ CareSchedules.ResultImageUrl: ADDED');
      }
      const colCheck2 = await pool.request().query(
        `SELECT COL_LENGTH('dbo.CareSchedules','ResultNote') AS len`
      );
      if (!colCheck2.recordset[0].len) {
        await pool.request().query(
          `ALTER TABLE dbo.CareSchedules ADD ResultNote NVARCHAR(500) NULL`
        );
        console.log('[Migration] ✅ CareSchedules.ResultNote: ADDED');
      }
      console.log('[Migration] ⏭  CareSchedules: ALREADY EXISTS');
      skip++;
    }
  } catch (e) {
    console.error('[Migration] ❌ CareSchedules:', e.message);
    fail++;
  }

  // ── 2. Performance Indexes ──────────────────────────────────────────────────
  const indexes = [
    {
      name: 'IX_CareSchedules_Cultivation_Date', table: 'CareSchedules',
      sql: `CREATE NONCLUSTERED INDEX IX_CareSchedules_Cultivation_Date
            ON dbo.CareSchedules (CultivationId ASC, ScheduledDate ASC)
            INCLUDE (ActivityType, Status, AssignedStaffId, Notes)`
    },
    {
      name: 'IX_CareSchedules_Date_Status', table: 'CareSchedules',
      sql: `CREATE NONCLUSTERED INDEX IX_CareSchedules_Date_Status
            ON dbo.CareSchedules (ScheduledDate ASC, Status ASC)
            INCLUDE (CultivationId, ActivityType, AssignedStaffId)`
    },
    {
      name: 'IX_RentalOrders_UserId_Status_Created', table: 'RentalOrders',
      sql: `CREATE NONCLUSTERED INDEX IX_RentalOrders_UserId_Status_Created
            ON dbo.RentalOrders (UserId ASC, Status ASC, CreatedAt DESC)
            INCLUDE (OrderCode, PlotId, SeedId, CarePackageId, TotalAmount, PaidAt,
                     DurationMonths, TotalRentalDays, StartDate, EndDate,
                     RentalFee, SeedFee, CareFee, DiscountAmount)`
    },
    {
      name: 'IX_Cultivations_PlotId_Status', table: 'Cultivations',
      sql: `CREATE NONCLUSTERED INDEX IX_Cultivations_PlotId_Status
            ON dbo.Cultivations (PlotId ASC, Status ASC)
            INCLUDE (CultivationId, OrderId, SeedId, StartDate, ExpectedHarvestDate, ProgressPercent)`
    },
    {
      name: 'IX_CareRequests_Staff_Status', table: 'CareRequests',
      sql: `CREATE NONCLUSTERED INDEX IX_CareRequests_Staff_Status
            ON dbo.CareRequests (AssignedStaffId ASC, Status ASC)
            INCLUDE (RequestId, CultivationId, ServiceType, CustomerNote, RequestedAt, CompletedAt)`
    },
    {
      name: 'IX_HarvestRequests_Status_Date', table: 'HarvestRequests',
      sql: `CREATE NONCLUSTERED INDEX IX_HarvestRequests_Status_Date
            ON dbo.HarvestRequests (Status ASC, RequestDate DESC)
            INCLUDE (HarvestRequestId, CultivationId, UserId, HarvestType, CustomerNote)`
    },
    {
      name: 'IX_CultivationLogs_CultivationId_LogDate', table: 'CultivationLogs',
      sql: `CREATE NONCLUSTERED INDEX IX_CultivationLogs_CultivationId_LogDate
            ON dbo.CultivationLogs (CultivationId ASC, LogDate DESC)
            INCLUDE (LogId, StaffId, ActivityType, Title, PlantHealthStatus, ImageUrl, CreatedAt)`
    },
    {
      name: 'IX_Deliveries_Status_ShippedAt', table: 'Deliveries',
      sql: `CREATE NONCLUSTERED INDEX IX_Deliveries_Status_ShippedAt
            ON dbo.Deliveries (Status ASC, ShippedAt DESC)
            INCLUDE (DeliveryId, HarvestRequestId, RecipientName, TrackingCode, CarrierName, DeliveredAt)`
    },
  ];

  for (const idx of indexes) {
    try {
      // Kiểm tra bảng tồn tại trước
      const tableCheck = await pool.request().query(
        `SELECT 1 FROM sys.tables WHERE name = '${idx.table}'`
      );
      if (tableCheck.recordset.length === 0) {
        console.log(`[Migration] ⏭  Index ${idx.name}: TABLE '${idx.table}' NOT EXISTS YET — SKIP`);
        skip++;
        continue;
      }

      const check = await pool.request().query(
        `SELECT 1 FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('dbo.${idx.table}')`
      );
      if (check.recordset.length === 0) {
        await pool.request().query(idx.sql);
        console.log(`[Migration] ✅ Index ${idx.name}: CREATED`);
        ok++;

      } else {
        console.log(`[Migration] ⏭  Index ${idx.name}: ALREADY EXISTS`);
        skip++;
      }
    } catch (e) {
      console.error(`[Migration] ❌ Index ${idx.name}:`, e.message);
      fail++;
    }
  }

  // ── 3. Stored Procedures ────────────────────────────────────────────────────
  const spCheck = await pool.request().query(
    `SELECT name FROM sys.procedures WHERE name IN ('sp_ExportOrderHistory','sp_ExportCultivationHistory')`
  );
  console.log(`[Migration] ⏭  Stored Procedures: ${spCheck.recordset.length}/2 exist (managed via schema.sql)`);

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`[Migration] DONE — Created: ${ok}, Skipped: ${skip}, Failed: ${fail}`);
  console.log('═══════════════════════════════════════════════');

  await closeDB();
  process.exit(fail > 0 ? 1 : 0);
}


runMigration().catch(e => {
  console.error('[Migration] FATAL:', e);
  process.exit(1);
});
