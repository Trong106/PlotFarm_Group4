# PlotFarm Backend

RESTful API and Realtime Gateway for PlotFarm Platform.

## Project Structure

```
Back-end/
├── src/
│   ├── config/           # Database and Swagger configuration
│   ├── controllers/      # HTTP request handlers
│   ├── services/         # Business logic and SQL queries
│   ├── models/           # Table names and constants
│   ├── routes/           # API route declarations
│   ├── middlewares/      # Authentication and error handling
│   ├── utils/            # Helper utilities
│   ├── socket/           # Socket.IO Realtime Gateway & event handlers
│   ├── public/           # Static test dashboards & assets
│   ├── app.js            # Express application setup
│   └── server.js         # Entry point and server initialization
├── scripts/              # Automated test and utility scripts
├── uploads/              # Uploaded media assets
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
└── README.md
```

## Setup and Running

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```
Update database credentials in `.env` if needed.

3. Run in development mode:
```bash
npm run dev
```

- API Base URL: `http://localhost:5000/api`
- API Documentation: `http://localhost:5000/` (Swagger UI)
- Health Check: `http://localhost:5000/api/health`
- Realtime Diagnostic UI: `http://localhost:5000/socket-test`

## Đăng ký tài khoản — POST /api/auth/register

API công khai nhận JSON, kiểm tra đầu vào bằng Zod và tạo tài khoản `Customer` ở trạng thái `ACTIVE`.

Trước khi chạy, khởi tạo SQL Server bằng `database/01_roles_and_users_schema.sql` ở thư mục gốc của repository, rồi cấu hình kết nối trong `.env`. Bảng `Users` phải có unique constraint `UQ_Users_Email` và bảng `Roles` phải có vai trò `Customer`. API dùng unique constraint để xử lý cả hai yêu cầu đăng ký cùng email đến đồng thời.

| Trường | Quy tắc |
|---|---|
| `fullName` | Bắt buộc, chuỗi 1–100 ký tự sau khi bỏ khoảng trắng đầu/cuối |
| `email` | Bắt buộc, email hợp lệ, tối đa 150 ký tự; bỏ khoảng trắng đầu/cuối và chuyển về chữ thường |
| `password` | Bắt buộc, tối thiểu 8 ký tự, tối đa 72 byte UTF-8, không chỉ chứa khoảng trắng; không trim mật khẩu |
| `phoneNumber` | Không bắt buộc; 9–15 chữ số, có thể bắt đầu bằng `+`; chuỗi rỗng, `null` hoặc không gửi được lưu là `NULL` |

Các trường ngoài schema, kể cả `role`, `roleId` và `status`, bị bỏ qua. Mật khẩu được băm bằng `bcryptjs` với salt riêng và cost 10; API không trả mật khẩu hay password hash.

Ví dụ gọi API bằng PowerShell:

```powershell
$body = @{
  fullName = 'Nguyễn Văn An'
  email = 'an@example.com'
  password = 'MatKhau123!'
  phoneNumber = '0901234567'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/register' `
  -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

Thành công (`201 Created`):

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "userId": 1,
    "fullName": "Nguyễn Văn An",
    "email": "an@example.com",
    "role": "Customer",
    "createdAt": "2026-09-10T00:00:00.000Z"
  },
  "timestamp": "2026-09-10T00:00:00.000Z"
}
```

Dữ liệu không hợp lệ (`400 Bad Request`):

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Dữ liệu đăng ký không hợp lệ",
  "errors": [{ "field": "email", "message": "Email không đúng định dạng" }],
  "timestamp": "2026-09-10T00:00:00.000Z"
}
```

Email trùng trả `409 Conflict` với lỗi của trường `email`. JSON sai cú pháp trả `400`; body quá lớn trả `413`. Lỗi máy chủ/cơ sở dữ liệu trả `500` và `errors: null`, không lộ chi tiết SQL hoặc stack trace. Các lỗi đều dùng cùng envelope JSON như trên. Hợp đồng đăng ký trả tên trường camelCase như API đăng nhập.

### Kiểm thử API đăng ký

```powershell
cd Back-end
npm.cmd ci
npm.cmd test
```

Bộ kiểm thử dùng HTTP Express thật, Zod thật và bcryptjs thật; chỉ giả lập SQL Server. Các trường hợp gồm đăng ký hợp lệ, đầu vào sai, email trùng, cạnh tranh đăng ký, role cố định, mật khẩu đã băm, lỗi database và JSON không hợp lệ. Server kiểm thử dùng cổng tạm và tự đóng khi hoàn tất; không ghi dữ liệu vào database hiện có.

Để chạy backend trong PowerShell, dùng `npm.cmd run dev`. Có thể thử API qua Swagger tại `http://localhost:5000/api/docs` sau khi cấu hình SQL Server.

## Realtime Gateway (Socket.IO)

### Supported Events
| Event (Client -> Server) | Payload | Server Response | Description |
|---|---|---|---|
| `ping` | `{ clientTime: number, message?: string }` | `pong` event + callback ack | Measures round-trip time (RTT latency) |
| `echo` | `any` | `echo_reply` event + callback ack | Echoes back received payload |
| `join_room` | `string` (room name) | `room_joined` event | Subscribes socket to room (e.g. `plot:101`) |
| `leave_room` | `string` (room name) | `room_left` event | Unsubscribes socket from room |
| `broadcast_to_room` | `{ room, event, data }` | Broadcast to peers | Emits event to all sockets in room |

### Testing Socket.IO
1. **Interactive Web Dashboard**: Open `http://localhost:5000/socket-test` in your browser.
2. **Automated CLI Benchmark**:
```bash
npm run test:socket
```
