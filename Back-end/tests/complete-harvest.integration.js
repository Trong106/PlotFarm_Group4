// Explicit integration check using connection-local temporary tables only.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { connectDB, sql } = require('../src/config/db');

(async () => {
  const pool = await connectDB();
  if (!pool) throw new Error('Database unavailable');
  try {
    let query;
    const mod = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/completeHarvest.js'), 'utf8'), {
      module: mod, require: () => ({ sql }),
    });
    await mod.exports({ request: () => ({ input() { return this; }, async query(q) { query = q; } }) }, 1);
    const run = query.replaceAll('Cultivations', '#Cultivations').replaceAll('Plots', '#Plots');
    await pool.request().query(`
      CREATE TABLE #Plots (PlotId INT, Status VARCHAR(30), ReservedUntil DATETIME, ReservedByUserId INT);
      CREATE TABLE #Cultivations (CultivationId INT, PlotId INT, OrderId INT, Status VARCHAR(30), ActualHarvestDate DATETIME, ProgressPercent INT);
      INSERT INTO #Plots VALUES (1,'RENTED',NULL,NULL);
      INSERT INTO #Cultivations VALUES (1,1,1,'READY_TO_HARVEST',NULL,90);
      DECLARE @CultivationId INT = 1;
      ${run}
      IF NOT EXISTS (SELECT 1 FROM #Plots WHERE Status='AVAILABLE') THROW 51000, 'Plot was not released', 1;
      IF NOT EXISTS (SELECT 1 FROM #Cultivations WHERE Status='HARVESTED' AND ProgressPercent=100 AND ActualHarvestDate IS NOT NULL) THROW 51000, 'Harvest not completed', 1;
      UPDATE #Plots SET Status='RENTED';
      INSERT INTO #Cultivations VALUES (2,1,2,'PLANTING',NULL,0);
      ${run.replaceAll('@Completed', '@Replay')}
      IF NOT EXISTS (SELECT 1 FROM #Plots WHERE Status='RENTED') THROW 51000, 'Replay released new tenant plot', 1;
      UPDATE #Cultivations SET Status='READY_TO_HARVEST' WHERE CultivationId=1;
      ${run.replaceAll('@Completed', '@Occupied')}
      IF NOT EXISTS (SELECT 1 FROM #Plots WHERE Status='RENTED') THROW 51000, 'Active cultivation ignored', 1;
      DROP TABLE #Cultivations;
      DROP TABLE #Plots;
    `);
    console.log('PASS: harvest releases plot; replay and other active cultivation do not release it.');
  } finally {
    await pool.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
