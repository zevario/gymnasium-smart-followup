import bcrypt from 'bcrypt';
import AuthenticationRepositories from './authentication.repository.js';
import response from '../../utils/response.js';

import { createTokens, hashToken, verifyToken } from './token.service.js';

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const user = await AuthenticationRepositories.findUserByEmail(email.toLowerCase());

    if (!user || !user.is_active) {
      return response.error(res, 'Invalid email or password', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return response.error(res, 'Invalid email or password', 401);
    }

    const tokens = createTokens(user);
    const decoded = verifyToken(tokens.refreshToken, 'refresh');

    const saved = await AuthenticationRepositories.saveSession(
      user.id,
      hashToken(tokens.refreshToken),
      new Date(decoded.exp * 1000),
      user.password_hash,
    );
    if (!saved) return response.error(res, 'Account changed. Sign in again.', 401);

    return response.success(res, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return response.success(res, 'User profile', {
    user: req.user,
  });
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const decoded = verifyToken(refreshToken, 'refresh');
    await AuthenticationRepositories.revokeSession(hashToken(refreshToken), decoded.sub);

    return response.success(res, 'Logout successful', null);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const decoded = verifyToken(refreshToken, 'refresh');

    const tokenHash = hashToken(refreshToken);
    const session = await AuthenticationRepositories.findSession(tokenHash);

    if (!session || session.user_id !== decoded.sub) {
      return response.error(res, 'Invalid session', 401);
    }

    const user = await AuthenticationRepositories.findUserById(decoded.sub);

    if (!user || !user.is_active) {
      return response.error(res, 'Account inactive', 401);
    }

    const tokens = createTokens(user);
    const newDecoded = verifyToken(tokens.refreshToken, 'refresh');

    const rotated = await AuthenticationRepositories.rotateSession(
      tokenHash,
      user.id,
      hashToken(tokens.refreshToken),
      new Date(newDecoded.exp * 1000),
      user.password_hash,
    );
    if (!rotated) return response.error(res, 'Invalid session', 401);

    return response.success(res, 'Token refreshed', tokens);
  } catch (error) {
    next(error);
  }
};

export { login, me, logout, refresh };
