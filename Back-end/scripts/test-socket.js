/**
 * Standalone Socket.IO Ping-Pong & Health Test Script
 * Run with: npm run test:socket
 */
const { io } = require('socket.io-client');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

console.log('====================================================');
console.log('        PlotFarm Socket.IO Realtime Ping-Pong Test   ');
console.log('====================================================');
console.log(`[Connecting] Target server: ${SERVER_URL}`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: false,
});

const timeoutTimer = setTimeout(() => {
  console.error('\n[TIMEOUT] Test failed: Server did not respond within 8 seconds.');
  console.error('Make sure the backend server is running (npm run dev or npm start).');
  socket.disconnect();
  process.exit(1);
}, 8000);

let testsPassed = 0;
const totalTests = 3;

// Connection event
socket.on('connect', () => {
  console.log(`[PASS] Connected successfully! Socket ID: ${socket.id}`);

  // Test 1: Ping-Pong event test
  runPingPongTest();
});

socket.on('welcome', (data) => {
  console.log(`[INFO] Server Welcome: "${data.message}" | Server Time: ${data.serverTime}`);
});

// Test 1: Event-based Ping-Pong
function runPingPongTest() {
  const startTime = Date.now();
  console.log(`\n--- Test 1: Event-Based Ping-Pong ---`);
  console.log(`[SEND] Emitting 'ping' with clientTime=${startTime}...`);

  socket.emit('ping', {
    clientTime: startTime,
    message: 'CLI Ping-Pong Test',
  });

  socket.once('pong', (data) => {
    const roundTripTime = Date.now() - startTime;
    console.log(`[RECV] Received 'pong' response:`, {
      message: data.message,
      socketId: data.socketId,
      serverTime: data.serverTime,
      calculatedRTT: `${roundTripTime} ms`,
    });
    console.log(`[PASS] Test 1: Ping-Pong event succeeded in ${roundTripTime}ms!`);
    testsPassed++;

    // Test 2: Ping with Ack Callback
    runPingWithAckTest();
  });
}

// Test 2: Acknowledgment Callback
function runPingWithAckTest() {
  const startTime = Date.now();
  console.log(`\n--- Test 2: Ping with Ack Callback ---`);
  console.log(`[SEND] Emitting 'ping' with acknowledgment callback...`);

  socket.emit(
    'ping',
    { clientTime: startTime, message: 'Ping Ack Callback Test' },
    (response) => {
      const ackRTT = Date.now() - startTime;
      console.log(`[RECV] Ack received in ${ackRTT}ms:`, response.message);
      console.log(`[PASS] Test 2: Ping Ack callback succeeded!`);
      testsPassed++;

      // Test 3: Join & Leave Room
      runRoomTest();
    }
  );
}

// Test 3: Join Room and Echo Test
function runRoomTest() {
  console.log(`\n--- Test 3: Room Subscription & Echo ---`);
  const testRoom = 'plot:test-zone-01';

  socket.emit('join_room', testRoom, (joinRes) => {
    console.log(`[PASS] Joined room: ${joinRes.room}`);

    socket.emit('echo', { hello: 'PlotFarm Realtime' }, (echoRes) => {
      console.log(`[PASS] Echo test confirmed:`, echoRes.data);
      testsPassed++;

      finishTesting();
    });
  });
}

function finishTesting() {
  clearTimeout(timeoutTimer);
  console.log('\n====================================================');
  console.log(`[SUMMARY] ${testsPassed}/${totalTests} Socket.IO tests PASSED!`);
  console.log('Socket.IO Realtime gateway is healthy and operational.');
  console.log('====================================================');

  socket.disconnect();
  process.exit(0);
}

socket.on('connect_error', (error) => {
  clearTimeout(timeoutTimer);
  console.error('\n[FAIL] Connection error:', error.message);
  console.error('Please ensure the PlotFarm backend server is running on port', PORT);
  process.exit(1);
});
