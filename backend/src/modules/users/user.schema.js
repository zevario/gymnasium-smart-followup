import Joi from 'joi';

const PROFILE_PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const validateProfilePhotoFile = (file) => {
  if (!file || !PROFILE_PHOTO_MIME_TYPES.has(file.mimetype)) {
    return false;
  }

  const { buffer } = file;
  if (!buffer || buffer.length < 12) return false;

  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (file.mimetype === 'image/png') {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
};

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(8).max(72, 'utf8').required(),
  role: Joi.string().valid('admin', 'spv', 'staff').required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email().max(150),
  password: Joi.string().min(8).max(72, 'utf8'),
  role: Joi.string().valid('admin', 'spv', 'staff'),
  is_active: Joi.boolean(),
}).min(1);

const updateOwnProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
});

const changeOwnPasswordSchema = Joi.object({
  currentPassword: Joi.string().max(1024).required(),
  newPassword: Joi.string().min(8).max(72, 'utf8').pattern(/[a-z]/).pattern(/[A-Z]/).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

export {
  createUserSchema,
  updateUserSchema,
  updateOwnProfileSchema,
  changeOwnPasswordSchema,
  PROFILE_PHOTO_MIME_TYPES,
  validateProfilePhotoFile,
};
