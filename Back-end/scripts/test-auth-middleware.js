const path = require('path');
const basePath = path.resolve(__dirname, '..');
const { verifyToken, checkRole, ROLES, requireAdmin } = require(path.join(basePath, 'src/middlewares/authMiddleware'));
const { generateToken } = require(path.join(basePath, 'src/utils/jwtHelper'));
const jwt = require('jsonwebtoken');

console.log('--- BẮT ĐẦU KIỂM THỬ AUTH MIDDLEWARE & RBAC  ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// Mock Express req, res, next
function createMockReqRes(headers = {}, user = null) {
  const req = { headers, user };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };
  return { req, res, next, isNextCalled: () => nextCalled };
}

// Test 1: Missing header
{
  const { req, res, next, isNextCalled } = createMockReqRes();
  verifyToken(req, res, next);
  assert(res.statusCode === 401 && !isNextCalled(), 'Test 1: Từ chối khi thiếu Authorization header (HTTP 401)');
}

// Test 2: Malformed format (not Bearer)
{
  const { req, res, next, isNextCalled } = createMockReqRes({ authorization: 'Basic 123456' });
  verifyToken(req, res, next);
  assert(res.statusCode === 401 && !isNextCalled(), 'Test 2: Từ chối khi định dạng không phải Bearer (HTTP 401)');
}

// Test 3: Invalid token signature
{
  const { req, res, next, isNextCalled } = createMockReqRes({ authorization: 'Bearer invalid.token.signature' });
  verifyToken(req, res, next);
  assert(res.statusCode === 401 && res.data.errors === 'INVALID_SIGNATURE', 'Test 3: Bắt lỗi token giả mạo/chữ ký sai (INVALID_SIGNATURE)');
}

// Test 4: Expired token
{
  const secret = process.env.JWT_SECRET || 'PlotFarm_Super_Secret_Key_2026_Team4';
  const expiredToken = jwt.sign({ userId: 1, role: 'Customer' }, secret, { expiresIn: '0s' });
  const { req, res, next, isNextCalled } = createMockReqRes({ authorization: `Bearer ${expiredToken}` });
  verifyToken(req, res, next);
  assert(res.statusCode === 401 && res.data.errors === 'TOKEN_EXPIRED', 'Test 4: Bắt chính xác lỗi token hết hạn (TOKEN_EXPIRED)');
}

// Test 5: Valid Customer Token
{
  const validToken = generateToken({ userId: 10, role: 'Customer', email: 'khach@plotfarm.vn' });
  const { req, res, next, isNextCalled } = createMockReqRes({ authorization: `Bearer ${validToken}` });
  verifyToken(req, res, next);
  assert(isNextCalled() && req.user.userId === 10 && req.user.role === 'Customer', 'Test 5: Xác thực thành công Bearer token hợp lệ và giải mã payload vào req.user');
}

// Test 6: checkRole - Reject if not authenticated
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, null); // req.user is null
  const roleMw = checkRole(['Customer']);
  roleMw(req, res, next);
  assert(res.statusCode === 401 && !isNextCalled(), 'Test 6: checkRole từ chối nếu request chưa qua verifyToken');
}

// Test 7: checkRole - Customer accessing Customer role (Allowed)
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, { userId: 10, role: 'Customer' });
  const roleMw = checkRole(['Customer']);
  roleMw(req, res, next);
  assert(isNextCalled() && res.statusCode === 200, 'Test 7: checkRole cho phép Customer truy cập tài nguyên của Customer');
}

// Test 8: checkRole - Customer accessing Admin role (Forbidden 403)
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, { userId: 10, role: 'Customer' });
  const roleMw = checkRole(['Admin']);
  roleMw(req, res, next);
  assert(res.statusCode === 403 && res.data.errors === 'FORBIDDEN_ROLE', 'Test 8: checkRole chặn quyền truy cập khi Customer đòi vào Admin (HTTP 403, FORBIDDEN_ROLE)');
}

// Test 9: checkRole - Staff accessing StaffOrAdmin
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, { userId: 5, role: 'Staff' });
  const roleMw = checkRole(['Staff', 'Admin']);
  roleMw(req, res, next);
  assert(isNextCalled() && res.statusCode === 200, 'Test 9: checkRole cho phép Staff truy cập tài nguyên dành cho [Staff, Admin]');
}

// Test 10: checkRole - Multiple arguments format checkRole('Admin', 'Staff')
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, { userId: 1, role: 'Admin' });
  const roleMw = checkRole('Admin', 'Staff');
  roleMw(req, res, next);
  assert(isNextCalled() && res.statusCode === 200, 'Test 10: Hỗ trợ linh hoạt cả 2 kiểu tham số checkRole(["Admin", "Staff"]) và checkRole("Admin", "Staff")');
}

// Test 11: Case-insensitive role check
{
  const { req, res, next, isNextCalled } = createMockReqRes({}, { userId: 1, role: 'Admin' });
  const roleMw = checkRole(['admin']); // lowercase
  roleMw(req, res, next);
  assert(isNextCalled(), 'Test 11: So khớp vai trò không phân biệt chữ hoa chữ thường ("Admin" vs "admin")');
}

console.log(`\n--- KẾT QUẢ: ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN ---`);
