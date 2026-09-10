const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string({ error: 'Họ tên là bắt buộc và phải là chuỗi' })
    .trim()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  email: z.string({ error: 'Email là bắt buộc và phải là chuỗi' })
    .trim()
    .toLowerCase()
    .max(150, 'Email không được vượt quá 150 ký tự')
    .pipe(z.email({ error: 'Email không đúng định dạng' })),
  password: z.string({ error: 'Mật khẩu là bắt buộc và phải là chuỗi' })
    .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
    .refine((value) => value.trim().length > 0, 'Mật khẩu không được chỉ chứa khoảng trắng')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Mật khẩu không được vượt quá 72 byte UTF-8'),
  phoneNumber: z.string({ error: 'Số điện thoại phải là chuỗi' })
    .trim()
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .regex(/^(?:\+?[0-9]{9,15})?$/, 'Số điện thoại phải gồm 9–15 chữ số, có thể bắt đầu bằng +')
    .transform((value) => value || null)
    .nullable()
    .optional(),
});

const loginSchema = z.object({
  email: z.string({ error: 'Email là bắt buộc và phải là chuỗi' })
    .trim()
    .toLowerCase()
    .min(1, 'Email không được để trống')
    .max(150, 'Email không được vượt quá 150 ký tự')
    .pipe(z.email({ error: 'Email không đúng định dạng' })),
  password: z.string({ error: 'Mật khẩu là bắt buộc và phải là chuỗi' })
    .min(1, 'Mật khẩu không được để trống')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Mật khẩu không được vượt quá 72 byte UTF-8'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
