import { passwordLimiter } from '../../middleware/rate-limit.js';
import { Router } from 'express';
import multer from 'multer';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';
import {
  getUsers,
  getUserById,
  updateOwnProfile,
  changeOwnPassword,
  uploadOwnProfilePhoto,
  getOwnProfilePhoto,
  getUserProfilePhoto,
  deleteOwnProfilePhoto,
  createUser,
  updateUser,
  deleteUser,
} from './user.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  updateOwnProfileSchema,
  changeOwnPasswordSchema,
  PROFILE_PHOTO_MIME_TYPES,
} from './user.schema.js';
import response from '../../utils/response.js';

const router = Router();

const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, callback) {
    if (!PROFILE_PHOTO_MIME_TYPES.has(file.mimetype)) {
      const error = new Error('File harus berupa JPG, PNG, atau WebP.');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const handleProfilePhotoUpload = (req, res, next) => {
  uploadProfilePhoto.single('photo')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return response.error(res, 'Ukuran foto maksimal 2 MB.', 413);
    }
    return response.error(res, error.message, error.statusCode || 400);
  });
};

router.use(authentication);

router.get('/', authorization('admin', 'spv'), getUsers);
router.get('/me/photo', getOwnProfilePhoto);
router.post('/me/photo', handleProfilePhotoUpload, uploadOwnProfilePhoto);
router.delete('/me/photo', deleteOwnProfilePhoto);
router.put('/me', validate(updateOwnProfileSchema), updateOwnProfile);
router.patch('/me/password', passwordLimiter, validate(changeOwnPasswordSchema), changeOwnPassword);
router.get('/:id/photo', authorization('admin'), getUserProfilePhoto);
router.get('/:id', authorization('admin', 'spv'), getUserById);
router.post('/', authorization('admin'), validate(createUserSchema), createUser);
router.put('/:id', authorization('admin'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorization('admin'), deleteUser);

export default router;
