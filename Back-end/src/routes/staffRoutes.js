/**
 * ============================================================================
 * PLOTFARM — STAFF ROUTES (/api/staff)
 * ============================================================================
 * Tất cả routes yêu cầu:
 *  - verifyToken : Phải đăng nhập (JWT hợp lệ)
 *  - checkRole   : Vai trò Staff hoặc Admin
 *
 * Endpoints:
 *  GET    /api/staff/my-plots                       — Danh sách ô đất phụ trách
 *  GET    /api/staff/care-requests                  — Yêu cầu chăm sóc cần xử lý
 *  POST   /api/staff/care-requests/:id/complete     — Hoàn thành yêu cầu chăm sóc + ảnh
 *  GET    /api/staff/harvest-orders                 — Đơn thu hoạch cần xử lý
 *  PATCH  /api/staff/harvest-orders/:id/progress    — Cập nhật tiến độ + mã vận đơn GHTK
 *  GET    /api/staff/schedules                      — Lịch trình chăm sóc
 *  PATCH  /api/staff/schedules/:id/complete         — Hoàn thành lịch chăm sóc
 *
 * Tác giả: PlotFarm Team 4 — Backend Engineer
 * ============================================================================
 */

const express  = require('express');
const router   = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, checkRole, ROLES } = require('../middlewares/authMiddleware');

// Middleware áp dụng cho toàn bộ routes trong module này
// Staff và Admin đều được phép truy cập Cổng Nhân Viên
const requireStaffOrAdmin = [verifyToken, checkRole(ROLES.STAFF, ROLES.ADMIN)];

// ─── Ô đất được phân công ────────────────────────────────────────────────────
/**
 * @route   GET /api/staff/my-plots
 * @desc    Lấy danh sách ô đất Staff đang phụ trách kèm thông tin mùa vụ hiện tại
 * @access  Staff, Admin
 */
router.get('/my-plots', requireStaffOrAdmin, staffController.getMyAssignedPlots);

// ─── Yêu cầu chăm sóc ────────────────────────────────────────────────────────
/**
 * @route   GET /api/staff/care-requests
 * @desc    Lấy danh sách yêu cầu chăm sóc trên ô đất phụ trách
 * @access  Staff, Admin
 * @query   status? (PENDING|COMPLETED|CANCELLED)
 */
router.get('/care-requests', requireStaffOrAdmin, staffController.getMyCareRequests);

/**
 * @route   POST /api/staff/care-requests/:id/complete
 * @desc    Nhận và hoàn thành yêu cầu chăm sóc kèm ảnh bằng chứng thực địa
 * @access  Staff, Admin
 * @body    { resultNote: string, resultImageUrl?: string, plantHealthStatus?: string }
 */
router.post('/care-requests/:id/complete', requireStaffOrAdmin, staffController.completeCareRequest);

// ─── Đơn thu hoạch ───────────────────────────────────────────────────────────
/**
 * @route   GET /api/staff/harvest-orders
 * @desc    Lấy danh sách đơn thu hoạch trên ô đất phụ trách
 * @access  Staff, Admin
 * @query   status? (REQUESTED|PROCESSING|HARVESTED|SHIPPING|DELIVERED)
 */
router.get('/harvest-orders', requireStaffOrAdmin, staffController.getMyHarvestOrders);

/**
 * @route   PATCH /api/staff/harvest-orders/:id/progress
 * @desc    Cập nhật tiến độ đơn thu hoạch & lưu mã vận đơn GHTK xe lạnh
 * @access  Staff, Admin
 * @body    { harvestStatus?, trackingCode?, carrierName?, deliveryStatus?, staffNote?, proofImageUrl? }
 */
router.patch('/harvest-orders/:id/progress', requireStaffOrAdmin, staffController.updateHarvestProgress);

// ─── Lịch trình chăm sóc ─────────────────────────────────────────────────────
/**
 * @route   GET /api/staff/schedules
 * @desc    Xem lịch trình chăm sóc dự kiến (hôm nay / tuần / tháng / toàn bộ)
 * @access  Staff, Admin
 * @query   range? (TODAY|WEEK|MONTH|ALL), cultivationId?, activityType?, status?
 */
router.get('/schedules', requireStaffOrAdmin, staffController.getMySchedules);

/**
 * @route   PATCH /api/staff/schedules/:id/complete
 * @desc    Đánh dấu hoàn thành một mục lịch chăm sóc
 * @access  Staff, Admin
 * @body    { resultNote?: string, resultImageUrl?: string }
 */
router.patch('/schedules/:id/complete', requireStaffOrAdmin, staffController.completeSchedule);

module.exports = router;
