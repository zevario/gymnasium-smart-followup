import bcrypt from 'bcrypt';
import UserRepositories from '../repositories/user-repositories.js';
import response from '../../../utils/response.js';
import { validateProfilePhotoFile } from '../validator/schema.js';

const getUsers = async (req, res, next) => {
  try {
    const users = await UserRepositories.getAll();
    return response.success(res, 'Users retrieved', users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await UserRepositories.getById(req.params.id);

    if (!user) return response.error(res, 'User not found', 404);

    return response.success(res, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};

const updateOwnProfile = async (req, res, next) => {
  try {
    const email = req.validated.email.toLowerCase();
    if (await UserRepositories.findByEmail(email, req.user.id)) {
      return response.error(res, 'Email sudah digunakan akun lain.', 409);
    }

    const user = await UserRepositories.updateOwnProfile(req.user.id, {
      name: req.validated.name,
      email,
    });
    if (!user) return response.error(res, 'User not found', 404);
    return response.success(res, 'Profile updated', user);
  } catch (error) {
    if (error.code === '23505') {
      return response.error(res, 'Email sudah digunakan akun lain.', 409);
    }
    return next(error);
  }
};

const changeOwnPassword = async (req, res, next) => {
  try {
    const passwordHash = await UserRepositories.getPasswordHash(req.user.id);
    if (!passwordHash) return response.error(res, 'User not found', 404);

    const currentPasswordValid = await bcrypt.compare(
      req.validated.currentPassword,
      passwordHash,
    );
    if (!currentPasswordValid) {
      return response.error(res, 'Current password is incorrect.', 400);
    }

    const samePassword = await bcrypt.compare(
      req.validated.newPassword,
      passwordHash,
    );
    if (samePassword) {
      return response.error(
        res,
        'New password must be different from current password.',
        400,
      );
    }

    const newPasswordHash = await bcrypt.hash(req.validated.newPassword, 12);
    const updated = await UserRepositories.updatePasswordHash(
      req.user.id,
      newPasswordHash,
    );
    if (!updated) return response.error(res, 'User not found', 404);

    return response.success(res, 'Password updated', null);
  } catch (error) {
    return next(error);
  }
};

const uploadOwnProfilePhoto = async (req, res, next) => {
  try {
    if (!validateProfilePhotoFile(req.file)) {
      return response.error(res, 'File harus berupa gambar JPG, PNG, atau WebP yang valid.', 400);
    }

    const mimeType = req.file.mimetype === 'image/jpg'
      ? 'image/jpeg'
      : req.file.mimetype;
    const updated = await UserRepositories.updateOwnProfilePhoto(
      req.user.id,
      req.file.buffer,
      mimeType,
    );
    if (!updated) return response.error(res, 'User not found', 404);

    return response.success(res, 'Profile photo uploaded', {
      mimeType,
      size: req.file.size,
    });
  } catch (error) {
    return next(error);
  }
};

const getOwnProfilePhoto = async (req, res, next) => {
  try {
    const photo = await UserRepositories.getOwnProfilePhoto(req.user.id);
    if (!photo) return response.error(res, 'User not found', 404);
    if (!photo.profile_photo) {
      return response.error(res, 'Profile photo not found', 404);
    }

    res.set({
      'Content-Type': photo.profile_photo_mime_type,
      'Content-Length': photo.profile_photo.length,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).send(photo.profile_photo);
  } catch (error) {
    return next(error);
  }
};

const getUserProfilePhoto = async (req, res, next) => {
  try {
    const photo = await UserRepositories.getProfilePhoto(req.params.id);
    if (!photo) return response.error(res, 'User not found', 404);
    if (!photo.profile_photo) {
      return response.error(res, 'Profile photo not found', 404);
    }

    res.set({
      'Content-Type': photo.profile_photo_mime_type,
      'Content-Length': photo.profile_photo.length,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).send(photo.profile_photo);
  } catch (error) {
    return next(error);
  }
};

const deleteOwnProfilePhoto = async (req, res, next) => {
  try {
    const updated = await UserRepositories.deleteOwnProfilePhoto(req.user.id);
    if (!updated) return response.error(res, 'User not found', 404);
    return response.success(res, 'Profile photo deleted', null);
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const email = req.validated.email.toLowerCase();

    if (await UserRepositories.findByEmail(email)) {
      return response.error(res, 'Email sudah terdaftar.', 409);
    }

    const data = {
      ...req.validated,
      email,
      password_hash: await bcrypt.hash(req.validated.password, 12),
    };

    delete data.password;

    const user = await UserRepositories.create(data,req.pilotLocation);

    return response.success(res, 'User created', user, 201);
  } catch (error) {
    if (error.code === '23505') {
      return response.error(res, 'Email sudah terdaftar.', 409);
    }

    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (
      req.params.id === req.user.id &&
      (
        req.validated.is_active === false ||
        (req.validated.role && req.validated.role !== req.user.role)
      )
    ) {
      return response.error(res, 'Cannot deactivate or change your own role', 400);
    }

    const data = { ...req.validated };

    if (data.email) {
      data.email = data.email.toLowerCase();

      if (await UserRepositories.findByEmail(data.email, req.params.id)) {
        return response.error(res, 'Email sudah digunakan akun lain.', 409);
      }
    }

    if (data.password) {
      data.password_hash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }

    const user = await UserRepositories.update(
      req.params.id,
      data,
    );

    if (!user) return response.error(res, 'User not found', 404);

    return response.success(res, 'User updated', user);
  } catch (error) {
    if (error.code === '23505') {
      return response.error(res, 'Email sudah digunakan akun lain.', 409);
    }

    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return response.error(res, 'Cannot deactivate your own account', 400);
    }

    const user = await UserRepositories.delete(req.params.id);

    if (!user) return response.error(res, 'User not found', 404);

    return response.success(res, 'User deleted', user);
  } catch (error) {
    next(error);
  }
};

export {
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
};