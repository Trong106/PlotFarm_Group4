const { sql } = require('../config/db');

// Run inside the caller's transaction. Only a fresh transition can release land:
// replaying an old delivery/result must never release a subsequent tenant's plot.
module.exports = async function completeHarvest(transaction, cultivationId) {
  await transaction.request()
    .input('CultivationId', sql.Int, cultivationId)
    .query(`
      DECLARE @Completed TABLE (PlotId INT, OrderId INT);
      UPDATE Cultivations WITH (UPDLOCK, HOLDLOCK)
      SET Status = 'HARVESTED',
          ActualHarvestDate = COALESCE(ActualHarvestDate, GETDATE()),
          ProgressPercent = 100
      OUTPUT inserted.PlotId, inserted.OrderId INTO @Completed
      WHERE CultivationId = @CultivationId AND Status = 'READY_TO_HARVEST';

      UPDATE p SET Status = 'AVAILABLE', ReservedUntil = NULL, ReservedByUserId = NULL
      FROM Plots p JOIN @Completed done ON done.PlotId = p.PlotId
      WHERE p.Status = 'RENTED'
        AND NOT EXISTS (
          SELECT 1 FROM Cultivations c WITH (UPDLOCK, HOLDLOCK)
          WHERE c.PlotId = p.PlotId AND c.Status NOT IN ('HARVESTED', 'FAILED')
        );
    `);
};
