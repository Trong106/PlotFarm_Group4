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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Nguyen Van A' },
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: '123456' },
                  phoneNumber: { type: 'string', example: '0901234567' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation error or email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user session',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Unauthorized' },
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
