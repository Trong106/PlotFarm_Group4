const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PlotFarm API Documentation',
      version: '1.0.0',
      description: 'RESTful API documentation for PlotFarm Platform',
      contact: {
        name: 'PlotFarm Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        RegistrationResponse: {
          type: 'object',
          required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 201 },
            message: { type: 'string', example: 'Đăng ký tài khoản thành công' },
            data: {
              type: 'object',
              required: ['token', 'user'],
              properties: {
                token: { type: 'string', description: 'Signed JWT for the new Customer account' },
                user: {
                  type: 'object',
                  properties: {
                    userId: { type: 'integer', example: 1 },
                    fullName: { type: 'string', example: 'Nguyễn Văn An' },
                    email: { type: 'string', format: 'email', example: 'an@example.com' },
                    roleId: { type: 'integer', example: 7 },
                    role: { type: 'string', enum: ['Customer'] },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        LoginResponse: {
          type: 'object',
          required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Đăng nhập thành công' },
            data: {
              type: 'object',
              required: ['token', 'user'],
              properties: {
                token: { type: 'string', description: 'Signed JWT Bearer token' },
                user: {
                  type: 'object',
                  properties: {
                    userId: { type: 'integer', example: 1 },
                    fullName: { type: 'string', example: 'Nguyễn Văn An' },
                    email: { type: 'string', format: 'email', example: 'an@example.com' },
                    roleId: { type: 'integer', example: 7 },
                    role: { type: 'string', example: 'Customer' },
                    phoneNumber: { type: 'string', nullable: true, example: '0901234567' },
                    avatarUrl: { type: 'string', nullable: true, example: null },
                    status: { type: 'string', example: 'ACTIVE' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        SessionResponse: {
          type: 'object',
          required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Lấy thông tin phiên đăng nhập thành công' },
            data: {
              type: 'object',
              required: ['userId', 'role', 'email'],
              properties: {
                userId: { type: 'integer', example: 1 },
                role: { type: 'string', example: 'Customer' },
                email: { type: 'string', format: 'email', example: 'an@example.com' },
                fullName: { type: 'string', example: 'Nguyễn Văn An' },
                iat: { type: 'integer', example: 1773128953 },
                exp: { type: 'integer', example: 1773215353 },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'statusCode', 'message', 'errors', 'timestamp'],
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Dữ liệu đăng ký không hợp lệ' },
            errors: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email không đúng định dạng' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const baseSwaggerSpec = {
  openapi: '3.0.0',
  info: swaggerOptions.definition.info,
  servers: swaggerOptions.definition.servers,
  components: swaggerOptions.definition.components,
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check server health status',
        responses: {
          200: {
            description: 'Server is running',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new customer account',
        description: 'Normalizes name/email and creates an ACTIVE Customer. Extra fields such as role are ignored. Passwords are hashed and never returned.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', minLength: 1, maxLength: 100, example: 'Nguyễn Văn An' },
                  email: { type: 'string', format: 'email', maxLength: 150, description: 'Trimmed and stored in lowercase', example: 'an@example.com' },
                  password: {
                    type: 'string', format: 'password', minLength: 8, maxLength: 72, writeOnly: true,
                    description: 'At least 8 characters, at most 72 UTF-8 bytes; cannot be only whitespace. Password whitespace is preserved.',
                    example: 'MatKhau123!',
                  },
                  phoneNumber: {
                    type: 'string', nullable: true, maxLength: 20,
                    pattern: '^(?:\\+?[0-9]{9,15})?$',
                    description: 'Optional: 9–15 digits with an optional leading +. Empty or null means no phone number.',
                    example: '0901234567',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrationResponse' } } },
          },
          400: {
            description: 'Validation error or malformed JSON',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Email already exists, including a concurrent registration',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          413: {
            description: 'Request body is too large',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Internal server or database error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticates user with email and password, returning signed JWT token and user details.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', maxLength: 150, example: 'an@example.com' },
                  password: {
                    type: 'string', format: 'password', maxLength: 72, writeOnly: true,
                    description: 'User password, at most 72 bytes UTF-8',
                    example: 'MatKhau123!',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: {
            description: 'Validation error or malformed JSON',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          401: {
            description: 'Invalid credentials (email not found or incorrect password)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Account is locked or inactive',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user session',
        description: 'Returns active session details decoded from JWT Bearer token.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user session details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } } },
          },
          401: {
            description: 'Missing, invalid, or expired JWT token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/plots/grid': {
      get: {
        tags: ['Plots'],
        summary: 'Get farm plots grid map',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['AVAILABLE', 'RESERVED', 'RENTED', 'FALLOWING', 'MAINTENANCE'],
            },
          },
          {
            name: 'areaId',
            in: 'query',
            required: false,
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          200: { description: 'List of plots' },
        },
      },
    },
    '/plots/reserve': {
      post: {
        tags: ['Plots'],
        summary: 'Reserve plot for 15 minutes',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plotId'],
                properties: {
                  plotId: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Plot reserved successfully' },
          400: { description: 'Plot is not available' },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
const finalSpec = {
  ...baseSwaggerSpec,
  ...swaggerSpec,
  paths: {
    ...baseSwaggerSpec.paths,
    ...(swaggerSpec.paths || {}),
    ...require('./userSwagger'),
  },
};

const setupSwagger = (app) => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(finalSpec, {
      customSiteTitle: 'PlotFarm API Docs',
    })
  );

  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(finalSpec);
  });
};

module.exports = {
  setupSwagger,
};
