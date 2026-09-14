const { getPool, sql } = require('../config/db');
const { TABLES } = require('../models');

const getAllSeeds = async (category) => {
  const pool = getPool();
  let query = `
    SELECT SeedId, SeedName, Category, GrowthDurationDays, MinRentalDays,
           ExpectedYieldKgPerM2, SuitableSoilType, Season, SeedPrice,
           ImageUrl, Description, IsAvailable
    FROM ${TABLES.SEEDS || 'Seeds'}
    WHERE IsAvailable = 1
  `;

  const request = pool.request();
  if (category && category !== 'ALL') {
    query += ` AND Category = @Category`;
    request.input('Category', sql.NVarChar(50), category);
  }

  query += ` ORDER BY SeedId ASC`;

  const result = await request.query(query);
  return result.recordset;
};

const getAllCarePackages = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT PackageId, PackageName, MonthlyFee, Description, ServicesIncluded, IsActive
    FROM ${TABLES.CARE_PACKAGES || 'CarePackages'}
    WHERE IsActive = 1
    ORDER BY MonthlyFee ASC
  `);
  return result.recordset;
};

module.exports = {
  getAllSeeds,
  getAllCarePackages,
};
