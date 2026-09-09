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
│   ├── app.js            # Express application setup
│   └── server.js         # Entry point and Socket.IO initialization
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
