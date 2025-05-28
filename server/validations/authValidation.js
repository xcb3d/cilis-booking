import Joi from 'joi';
import { EXPERT_FIELDS } from '../utils/constants.js';

// Validation schema cho login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email không được để trống'
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': 'Mật khẩu là bắt buộc',
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự'
  })
});

// Schema cơ bản cho đăng ký
const baseRegisterSchema = {
  name: Joi.string().required().messages({
    'any.required': 'Tên là bắt buộc',
    'string.empty': 'Tên không được để trống'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email không được để trống'
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': 'Mật khẩu là bắt buộc',
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự'
  }),
  role: Joi.string().valid('client', 'expert').default('client').required(),
  phone: Joi.string().required().messages({
    'any.required': 'Số điện thoại là bắt buộc',
    'string.empty': 'Số điện thoại không được để trống'
  }),
};

// Validation schema cho đăng ký client
const clientRegisterSchema = Joi.object({
  ...baseRegisterSchema,
});

// Validation schema cho đăng ký expert
const expertRegisterSchema = Joi.object({
  ...baseRegisterSchema,
  // Các trường bổ sung cho expert
  field: Joi.string().valid(...EXPERT_FIELDS).required().messages({
    'any.required': 'Lĩnh vực chuyên môn là bắt buộc',
    'string.empty': 'Lĩnh vực chuyên môn không được để trống',
    'any.only': 'Lĩnh vực chuyên môn không hợp lệ, vui lòng chọn một trong các lĩnh vực được liệt kê'
  }),
  expertise: Joi.string().required().min(10).max(200).messages({
    'any.required': 'Chuyên ngành cụ thể là bắt buộc',
    'string.empty': 'Chuyên ngành cụ thể không được để trống',
    'string.min': 'Chuyên ngành cụ thể phải có ít nhất {#limit} ký tự',
    'string.max': 'Chuyên ngành cụ thể không được vượt quá {#limit} ký tự'
  }),
  experience: Joi.string().required().min(10).max(500).messages({
    'any.required': 'Kinh nghiệm là bắt buộc',
    'string.empty': 'Kinh nghiệm không được để trống',
    'string.min': 'Kinh nghiệm phải có ít nhất {#limit} ký tự',
    'string.max': 'Kinh nghiệm không được vượt quá {#limit} ký tự'
  }),
  price: Joi.number().integer().min(100000).required().messages({
    'any.required': 'Giá tư vấn là bắt buộc',
    'number.base': 'Giá tư vấn phải là số',
    'number.integer': 'Giá tư vấn phải là số nguyên',
    'number.min': 'Giá tư vấn phải ít nhất {#limit} VNĐ'
  }),
});

// Validation schema chung cho register
const registerSchema = Joi.alternatives().conditional(
  Joi.object({ role: Joi.string().valid('expert').required() }).unknown(),
  {
    then: expertRegisterSchema,
    otherwise: clientRegisterSchema
  }
);

// Middleware validate login
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Middleware validate register
const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export default {
  validateLogin,
  validateRegister,
  EXPERT_FIELDS
};
