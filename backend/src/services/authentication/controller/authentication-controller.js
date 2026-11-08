import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import AuthenticationRepositories from '../repositories/authentication-repositories.js';
import response from '../../../utils/response.js';

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const createTokens = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const user = await AuthenticationRepositories.findUserByEmail(
      email.toLowerCase(),
    );

    if (!user || !user.is_active) {
      return response.error(res, 'Invalid email or password', 401);
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!validPassword) {
      return response.error(res, 'Invalid email or password', 401);
    }

    const tokens = createTokens(user);
    const decoded = jwt.decode(tokens.refreshToken);

    await AuthenticationRepositories.saveSession(
      user.id,
      hashToken(tokens.refreshToken),
      new Date(decoded.exp * 1000),
    );

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
    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthenticationRepositories.revokeSession(
        hashToken(refreshToken),
      );
    }

    return response.success(res, 'Logout successful', null);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
    );

    const tokenHash = hashToken(refreshToken);
    const session = await AuthenticationRepositories.findSession(tokenHash);

    if (!session || session.user_id !== decoded.sub) {
      return response.error(res, 'Invalid session', 401);
    }

    const user = await AuthenticationRepositories.findUserById(decoded.sub);

    if (!user || !user.is_active) {
      return response.error(res, 'Account inactive', 401);
    }

    await AuthenticationRepositories.revokeSession(tokenHash);

    const tokens = createTokens(user);
    const newDecoded = jwt.decode(tokens.refreshToken);

    await AuthenticationRepositories.saveSession(
      user.id,
      hashToken(tokens.refreshToken),
      new Date(newDecoded.exp * 1000),
    );

    return response.success(res, 'Token refreshed', tokens);
  } catch (error) {
    next(error);
  }
};

export { login, me, logout, refresh };