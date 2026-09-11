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

Trước khi chạy, khởi tạo SQL Server bằng `database/schema.sql` ở thư mục gốc của repository, rồi cấu hình kết nối trong `.env`. Bảng `Users` phải có unique constraint `UQ_Users_Email` và bảng `Roles` phải có vai trò `Customer`. API dùng unique constraint để xử lý cả hai yêu cầu đăng ký cùng email đến đồng thời.

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
    "token": "<JWT của tài khoản vừa đăng ký>",
    "user": {
      "userId": 1,
      "fullName": "Nguyễn Văn An",
      "email": "an@example.com",
      "roleId": 7,
      "role": "Customer",
      "createdAt": "2026-09-10T00:00:00.000Z"
    }
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

### Kiểm thử tự động (Unit / Integration Tests)

```powershell
cd Back-end
npm.cmd ci
npm.cmd test
```

Bộ kiểm thử bao gồm 28 test cases chạy tự động bằng `node:test` cho cả hai module Đăng ký (`auth-register.test.js`) và Đăng nhập / Phiên làm việc (`auth-login.test.js`).

## Đăng nhập hệ thống — POST /api/auth/login

API công khai nhận JSON, kiểm tra đầu vào bằng Zod schema (`loginSchema`), đối soát tài khoản và xác minh mật khẩu bằng `bcryptjs`. Trả về JWT token kèm thông tin người dùng.

| Trường | Quy tắc |
|---|---|
| `email` | Bắt buộc, chuỗi email hợp lệ, tối đa 150 ký tự; tự động bỏ khoảng trắng và chuyển chữ thường |
| `password` | Bắt buộc, tối thiểu 1 ký tự, tối đa 72 byte UTF-8 (giới hạn bảo mật của bcrypt) |

Ví dụ gọi API bằng PowerShell:

```powershell
$body = @{
  email = 'mai@example.com'
  password = 'MatKhau123!'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' `
  -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

Thành công (`200 OK`):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "<Signed JWT Token>",
    "user": {
      "userId": 10,
      "fullName": "Trần Thị Mai",
      "email": "mai@example.com",
      "roleId": 3,
      "role": "Customer",
      "phoneNumber": "0912345678",
      "avatarUrl": null,
      "status": "ACTIVE",
      "createdAt": "2026-09-10T08:00:00.000Z"
    }
  },
  "timestamp": "2026-09-10T08:00:00.000Z"
}
```

Các mã lỗi:
- `400 Bad Request`: Thiếu email/password, sai định dạng email, mật khẩu vượt quá 72 byte UTF-8 hoặc JSON sai cú pháp.
- `401 Unauthorized`: Sai email hoặc sai mật khẩu (`"Email hoặc mật khẩu không chính xác"` - cùng một thông báo để chống enumeration).
- `403 Forbidden`: Tài khoản có trạng thái không phải `ACTIVE` (`"Tài khoản đã bị tạm khóa hoặc chưa kích hoạt"`).
- `500 Internal Server Error`: Lỗi kết nối CSDL hoặc lỗi hệ thống bất ngờ (không làm lộ query hay thông tin nhạy cảm).

## Lấy thông tin phiên đăng nhập — GET /api/auth/me

API yêu cầu xác thực Bearer token qua header `Authorization: Bearer <token>`. Trả về thông tin phiên làm việc hiện tại của tài khoản.

Ví dụ gọi API bằng PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/api/auth/me' `
  -Headers @{ Authorization = "Bearer $token" }
```

Thành công (`200 OK`):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin phiên đăng nhập thành công",
  "data": {
    "userId": 10,
    "role": "Customer",
    "email": "mai@example.com",
    "fullName": "Trần Thị Mai",
    "iat": 1773128953,
    "exp": 1773215353
  },
  "timestamp": "2026-09-10T08:00:00.000Z"
}
```

Các mã lỗi:
- `401 Unauthorized`: Thiếu header Authorization, header không đúng định dạng `Bearer <token>`, token không hợp lệ hoặc token đã hết hạn.

Để chạy backend trong PowerShell, dùng `npm.cmd run dev`. Có thể thử nghiệm trực quan tất cả các API qua Swagger UI tại `http://localhost:5000/api/docs`.

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
# User Profile & Shipping Address APIs

Chạy script duy nhất `database/schema.sql` trên SQL Server trước khi khởi động server hoặc kiểm thử. Script này có thể chạy lại nhiều lần (idempotent) mà không xóa hay làm mất dữ liệu.

Tất cả API dưới đây yêu cầu header `Authorization: Bearer <token>` của tài khoản `ACTIVE`.
`userId` luôn lấy từ JWT. Không được truyền `userId`, `roleId`, `status`, mật khẩu hoặc trường ngoài schema trong body.

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/users/me` | Đọc hồ sơ mới nhất từ database |
| PATCH | `/api/users/me` | Cập nhật một phần hồ sơ |
| GET | `/api/users/me/addresses` | Danh sách địa chỉ của mình, địa chỉ mặc định trước |
| POST | `/api/users/me/addresses` | Tạo địa chỉ, trả HTTP 201 |
| GET | `/api/users/me/addresses/:addressId` | Xem chi tiết địa chỉ |
| PATCH | `/api/users/me/addresses/:addressId` | Cập nhật một phần địa chỉ |
| DELETE | `/api/users/me/addresses/:addressId` | Xóa địa chỉ, trả HTTP 200 với `data: null` |

Ví dụ body cập nhật hồ sơ:

```json
{
  "fullName": "Nguyễn Văn An",
  "email": "an@example.com",
  "phoneNumber": "0901234567",
  "avatarUrl": "https://example.com/avatar.png"
}
```

Các trường đều tùy chọn khi PATCH nhưng phải có ít nhất một trường. Tên tối đa 100 ký tự;
email hợp lệ, tối đa 150 ký tự, được trim và chuyển thành chữ thường. Số điện thoại gồm 9–15 chữ số,
có thể bắt đầu bằng `+`; `null` hoặc chuỗi rỗng xóa số điện thoại hồ sơ. Avatar phải là URL HTTP(S),
tối đa 500 ký tự; `null` xóa avatar. Email trùng trả 409. Các claim trong JWT cũ không được cập nhật;
sau khi sửa hồ sơ, frontend lấy dữ liệu từ response hoặc `GET /api/users/me`.
`GET /api/auth/me` vẫn là thông tin phiên trong JWT.

Ví dụ body tạo địa chỉ:

```json
{
  "recipientName": "Nguyễn Văn An",
  "phoneNumber": "0901234567",
  "addressLine": "12 Nguyễn Huệ",
  "ward": "Bến Nghé",
  "province": "TP. Hồ Chí Minh",
  "isDefault": true
}
```

Tên người nhận, số điện thoại, địa chỉ chi tiết, phường/xã và tỉnh/thành phố là bắt buộc.
`district` (quận/huyện) tùy chọn, có thể là `null`. Tên người nhận và các đơn vị hành chính tối đa 100 ký tự;
địa chỉ chi tiết tối đa 255 ký tự. Trường chuỗi bắt buộc không được chỉ chứa khoảng trắng.
`isDefault` phải là boolean, mặc định `false` khi tạo.

Đổi địa chỉ mặc định bằng `PATCH /api/users/me/addresses/:addressId` với `{"isDefault": true}`.
Mỗi người có tối đa một địa chỉ mặc định, được bảo vệ bằng transaction, khóa theo người dùng và unique filtered index.
Sổ địa chỉ có thể không có mặc định; xóa hoặc bỏ mặc định không tự chọn địa chỉ thay thế.
ID phải là số nguyên dương trong giới hạn SQL INT. Địa chỉ không tồn tại hoặc thuộc người khác đều trả 404.
Xóa địa chỉ đang được dữ liệu khác tham chiếu trả 409.

Response thành công dùng `{ success, statusCode, message, data, timestamp }`;
lỗi dùng `{ success, statusCode, message, errors, timestamp }`. Validation trả 400 kèm danh sách
`{ field, message }`; thiếu/sai token trả 401, tài khoản khóa/chưa kích hoạt trả 403.
Try-catch chuyển lỗi về middleware chung, lỗi 500 không lộ SQL hoặc stack trace.

Swagger: `/api/docs` và `/api/docs.json`. Chạy `npm test` để kiểm tra auth và user profile/address.
Các bài kiểm thử HTTP dùng database mock, kiểm tra SQL được parameter hóa, phạm vi người dùng,
validation, HTTP status, response và commit/rollback; không thay thế kiểm thử trên SQL Server thực tế.

Chạy `npm run test:profile:sql` để kiểm tra trên SQL Server cấu hình trong `.env` sau khi tạo schema.
Script tạo hai tài khoản thử riêng, kiểm tra dữ liệu được lưu, CRUD, quyền sở hữu, đổi mặc định đồng thời
và rollback thực tế, rồi xóa dữ liệu thử trong `finally`. Chạy trên database phát triển/kiểm thử.
