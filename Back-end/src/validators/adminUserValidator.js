const { z } = require('zod');

const positiveInteger = (label, max, fallback) => z.string({ error: `${label} phải là một số nguyên dương` })
  .regex(/^[1-9][0-9]*$/, `${label} phải là số nguyên dương, không có ký tự khác`)
  .transform(Number)
  .pipe(z.number().int().max(max, `${label} không được vượt quá ${max}`))
  .default(fallback);

const listUsersQuerySchema = z.object({
  page: positiveInteger('page', 2147483647, 1),
  limit: positiveInteger('limit', 100, 10),
  search: z.string({ error: 'search phải là một chuỗi' }).trim()
    .max(150, 'Từ khóa tìm kiếm không được vượt quá 150 ký tự').default(''),
}).strict().superRefine(({ page, limit }, ctx) => {
  if ((page - 1) * limit > 2147483647) {
    ctx.addIssue({ code: 'custom', path: ['page'], message: 'Vị trí phân trang vượt giới hạn cho phép' });
  }
});

module.exports = { listUsersQuerySchema };
