/**
 * Database Models and Table Mapping for PlotFarmDB (MS SQL Server)
 */
const TABLES = {
  ROLES: 'Roles',
  USERS: 'Users',
  USER_ADDRESSES: 'UserAddresses',
  FARMS: 'Farms',
  FARM_AREAS: 'FarmAreas',
  PLOTS: 'Plots',
  CAMERAS: 'Cameras',
  SENSOR_DATA: 'SensorData',
  SEEDS: 'Seeds',
  GROWTH_STAGES: 'GrowthStages',
  CARE_PACKAGES: 'CarePackages',
  RENTAL_ORDERS: 'RentalOrders',
  ORDER_DETAILS: 'OrderDetails',
  PAYMENTS: 'Payments',
  CULTIVATIONS: 'Cultivations',
  CULTIVATION_LOGS: 'CultivationLogs',
  CARE_REQUESTS: 'CareRequests',
  STAFF_ASSIGNMENTS: 'StaffAssignments',
  HARVEST_REQUESTS: 'HarvestRequests',
  HARVEST_RESULTS: 'HarvestResults',
  DELIVERIES: 'Deliveries',
  NOTIFICATIONS: 'Notifications',
};

const PLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  RENTED: 'RENTED',
  FALLOWING: 'FALLOWING',
  MAINTENANCE: 'MAINTENANCE',
};

const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

const CULTIVATION_STATUS = {
  PLANTING: 'PLANTING',
  GROWING: 'GROWING',
  READY_TO_HARVEST: 'READY_TO_HARVEST',
  HARVESTED: 'HARVESTED',
  FAILED: 'FAILED',
};

module.exports = {
  TABLES,
  PLOT_STATUS,
  ORDER_STATUS,
  CULTIVATION_STATUS,
};
