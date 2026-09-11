const { z } = require('zod');
const { registerSchema } = require('./authValidator');

const nonEmptyPatch = (schema) => schema.refine(
  (data) => Object.keys(data).length > 0,
  'Cần cung cấp ít nhất một trường để cập nhật'
);
const text = (label, max) => z.string({ error: `${label} phải là chuỗi` })
  .trim().min(1, `${label} không được để trống`).max(max, `${label} không được vượt quá ${max} ký tự`);

const updateProfileSchema = nonEmptyPatch(z.object({
  fullName: registerSchema.shape.fullName.optional(),
  email: registerSchema.shape.email.optional(),
  phoneNumber: registerSchema.shape.phoneNumber,
  avatarUrl: z.string().trim().max(500)
    .refine((value) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol); }
      catch { return false; }
    }, 'Ảnh đại diện phải là URL HTTP hoặc HTTPS hợp lệ').nullable().optional(),
}).strict());

const createAddressSchema = z.object({
  recipientName: text('Tên người nhận', 100),
  phoneNumber: z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Số điện thoại phải gồm 9–15 chữ số, có thể bắt đầu bằng +'),
  addressLine: text('Địa chỉ chi tiết', 255),
  ward: text('Phường/xã', 100),
  district: text('Quận/huyện', 100).nullable().optional(),
  province: text('Tỉnh/thành phố', 100),
  isDefault: z.boolean().optional(),
}).strict();

const updateAddressSchema = nonEmptyPatch(createAddressSchema.partial());
const addressParamsSchema = z.object({
  addressId: z.string().regex(/^[1-9][0-9]*$/, 'Mã địa chỉ phải là số nguyên dương')
    .transform(Number).pipe(z.number().int().max(2147483647, 'Mã địa chỉ vượt giới hạn')),
});

module.exports = { updateProfileSchema, createAddressSchema, updateAddressSchema, addressParamsSchema };
