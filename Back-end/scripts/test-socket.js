/**
 * Standalone Socket.IO Ping-Pong & JWT Authentication / Role-Based Test Script
 * Run with: npm run test:socket
 */
const { io } = require('socket.io-client');
require('dotenv').config();
const { generateToken } = require('../src/utils/jwtHelper');

const PORT = process.env.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

console.log('====================================================');
console.log('  PlotFarm Socket.IO JWT Auth & Role-Based Test     ');
console.log('====================================================');

// Tạo các token thử nghiệm
const adminToken = generateToken({
  userId: 1,
  role: 'Admin',
  email: 'admin@plotfarm.vn',
  fullName: 'Administrator',
});

const customerToken = generateToken({
  userId: 99,
  role: 'Customer',
  email: 'customer@plotfarm.vn',
  fullName: 'Nguyen Van A',
});

const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature';

let passedCount = 0;
const totalExpected = 5;

// ==========================================
// TEST 1: KẾT NỐI VỚI TOKEN ADMIN (HỢP LỆ)
// ==========================================
console.log(`\n[STEP 1] Kết nối Socket.IO với JWT Token của Admin...`);
const adminSocket = io(SERVER_URL, {
  auth: { token: `Bearer ${adminToken}` },
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: false,
});

adminSocket.on('connect', () => {
  console.log(`[PASS 1] Admin Socket kết nối thành công! ID: ${adminSocket.id}`);
  passedCount++;

  // Lắng nghe welcome event
  adminSocket.once('welcome', (welcomeData) => {
    console.log(`[INFO] Server Welcome:`, welcomeData.message);
    console.log(`[INFO] Định danh User nhận được:`, welcomeData.user);

    if (welcomeData.user && welcomeData.user.role === 'Admin' && welcomeData.user.userId === 1) {
      console.log(`[PASS 2] Middleware giải mã JWT chính xác: User #1 - Role [Admin]`);
      passedCount++;
    }

    // TEST 3: Admin thực hiện admin_action
    adminSocket.emit('admin_action', { task: 'RESTART_IRRIGATION_ZONE_1' }, (actionRes) => {
      if (actionRes.success && actionRes.statusCode === 200) {
        console.log(`[PASS 3] Admin thực hiện admin_action thành công: ${actionRes.message}`);
        passedCount++;
      } else {
        console.error(`[FAIL 3] admin_action thất bại:`, actionRes);
      }

      adminSocket.disconnect();
      runCustomerRoleTest();
    });
  });
});

adminSocket.on('connect_error', (err) => {
  console.error('[FAIL] Admin Socket connect_error:', err.message);
  process.exit(1);
});

// ==========================================
// TEST 4: CUSTOMER BỊ TỪ CHỐI ADMIN_ACTION
// ==========================================
function runCustomerRoleTest() {
  console.log(`\n[STEP 2] Kết nối Socket.IO với Token Customer (Role: Customer)...`);
  const custSocket = io(SERVER_URL, {
    auth: { token: customerToken },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: false,
  });

  custSocket.on('connect', () => {
    console.log(`[INFO] Customer Socket kết nối thành công! ID: ${custSocket.id}`);

    // Thử gọi admin_action
    custSocket.emit('admin_action', { task: 'DELETE_DATABASE' }, (res) => {
      if (!res.success && res.statusCode === 403) {
        console.log(`[PASS 4] Phân quyền Role-based chặn thành công Customer gọi admin_action (403 Forbidden)!`);
        passedCount++;
      } else {
        console.error(`[FAIL 4] Phân quyền thất bại: Customer lại được phép!`, res);
      }

      custSocket.disconnect();
      runInvalidTokenTest();
    });
  });
}

// ==========================================
// TEST 5: TOKEN KHÔNG HỢP LỆ BỊ TỪ CHỐI
// ==========================================
function runInvalidTokenTest() {
  console.log(`\n[STEP 3] Thử nghiệm kết nối với Token JWT GIẢ MẠO...`);
  const badSocket = io(SERVER_URL, {
    auth: { token: invalidToken },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: false,
  });

  badSocket.on('connect', () => {
    console.error(`[FAIL 5] Lỗi: Socket với token giả lại kết nối được!`);
    badSocket.disconnect();
    finishAll();
  });

  badSocket.on('connect_error', (err) => {
    console.log(`[PASS 5] Middleware bắt và chặn kết nối thành công! Lỗi: "${err.message}"`);
    passedCount++;
    finishAll();
  });
}

function finishAll() {
  console.log('\n====================================================');
  console.log(`[KẾT QUẢ] Đạt ${passedCount}/${totalExpected} kịch bản kiểm thử JWT Socket.IO!`);
  if (passedCount === totalExpected) {
    console.log('✅ Hệ thống xác thực JWT & phân quyền Role-based Socket.IO hoạt động hoàn hảo.');
  } else {
    console.log('⚠️ Có một số kịch bản chưa đạt yêu cầu.');
  }
  console.log('====================================================');
  process.exit(passedCount === totalExpected ? 0 : 1);
}
