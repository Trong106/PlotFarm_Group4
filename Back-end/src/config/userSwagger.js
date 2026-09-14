const string = (maxLength, extra = {}) => ({ type: 'string', minLength: 1, maxLength, ...extra });
const profileProperties = {
  fullName: string(100), email: string(150, { format: 'email' }),
  phoneNumber: { type: 'string', maxLength: 20, nullable: true, pattern: '^(?:\\+?[0-9]{9,15})?$', description: 'Empty string or null clears the phone number.' },
  avatarUrl: string(500, { format: 'uri', nullable: true, description: 'Absolute HTTP(S) URL; null clears the avatar.' }),
};
const addressProperties = {
  recipientName: string(100), phoneNumber: string(20, { pattern: '^\\+?[0-9]{9,15}$' }),
  addressLine: string(255), ward: string(100), district: string(100, { nullable: true }), province: string(100),
  isDefault: { type: 'boolean', description: 'Setting true clears the previous default atomically. Omitted on create means false.' },
};
const timestamps = { createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time', nullable: true } };
const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
const profile = { type: 'object', properties: { ...profileProperties, userId: id, roleId: id, status: { type: 'string' }, ...timestamps } };
const address = { type: 'object', properties: { ...addressProperties, addressId: id, userId: id, ...timestamps } };
const body = (properties, required, patch = false) => ({
  required: true,
  content: { 'application/json': { schema: {
    type: 'object', additionalProperties: false, properties,
    ...(required ? { required } : {}), ...(patch ? { minProperties: 1 } : {}),
  } } },
});
const operation = (summary, data, { status = 200, requestBody, addressId = false, conflict = false } = {}) => ({
  tags: ['User Profile'], summary, security: [{ BearerAuth: [] }],
  description: 'Operates on the authenticated ACTIVE user only. Unknown request fields are rejected. Address books may have zero or one default; deleting or unsetting the default does not promote another address.',
  ...(requestBody ? { requestBody } : {}),
  ...(addressId ? { parameters: [{ name: 'addressId', in: 'path', required: true, schema: id }] } : {}),
  responses: {
    [status]: { description: 'Success', content: { 'application/json': { schema: {
      type: 'object', required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
      properties: { success: { type: 'boolean', example: true }, statusCode: { type: 'integer', example: status },
        message: { type: 'string' }, data, timestamp: { type: 'string', format: 'date-time' } },
    } } } },
    ...Object.fromEntries(Object.entries({ 400: 'Invalid body or path parameters', 401: 'Missing or invalid token',
      403: 'Account is inactive', 404: 'User or owned address not found',
      ...(conflict ? { 409: 'Email already exists or address is referenced by another record' } : {}),
      413: 'Request body too large', 500: 'Internal server error',
    }).map(([code, description]) => [code, { description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }])),
  },
});

module.exports = {
  '/users': {
    get: {
      ...operation('Search and paginate users (Admin only)', {
        type: 'object', required: ['users', 'pagination'], properties: {
          users: { type: 'array', items: { ...profile, properties: {
            ...profile.properties, role: { type: 'string', enum: ['Admin', 'Staff', 'Customer'] },
          } } },
          pagination: { type: 'object', properties: {
            page: { type: 'integer', minimum: 1, example: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
            total: { type: 'integer', minimum: 0, example: 23 },
            totalPages: { type: 'integer', minimum: 0, example: 3 },
            hasNextPage: { type: 'boolean', example: true }, hasPreviousPage: { type: 'boolean', example: false },
          } },
        },
      }),
      tags: ['Admin Users'],
      description: 'Requires an Admin JWT and a current ACTIVE Admin account in the database. Searches literal substrings in name, email or phone; blank search lists all users, including locked/pending accounts. Sorted by CreatedAt DESC, UserId DESC. No passwords or hashes are returned. Unknown or repeated query parameters are rejected. Pages beyond the last page return an empty users array with the actual total.',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string', maxLength: 150, default: '' },
          description: 'Trimmed search text. SQL LIKE characters %, _, [ and ~ are treated literally. Case/accent matching follows database collation.' },
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 2147483647, default: 1 },
          description: 'Positive decimal integer. (page - 1) * limit must not exceed 2147483647.' },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Number of users per page. Positive decimal integer.' },
      ],
    },
  },
  '/users/me': {
    get: operation('Get current profile from database', profile),
    patch: operation('Update current profile', profile, { requestBody: body(profileProperties, null, true), conflict: true }),
  },
  '/users/me/addresses': {
    get: operation('List own shipping addresses (default first)', { type: 'array', items: address }),
    post: operation('Create shipping address', address, { status: 201,
      requestBody: body(addressProperties, ['recipientName', 'phoneNumber', 'addressLine', 'ward', 'province']) }),
  },
  '/users/me/addresses/{addressId}': {
    get: operation('Get own shipping address', address, { addressId: true }),
    patch: operation('Update own shipping address', address, { addressId: true, requestBody: body(addressProperties, null, true) }),
    delete: operation('Delete own shipping address', { type: 'object', nullable: true, example: null }, { addressId: true, conflict: true }),
  },
};
