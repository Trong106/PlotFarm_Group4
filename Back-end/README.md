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
