import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const issuer = 'gymnasyum';
const audience = 'gymnasyum-api';
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function createTokens(user) {
  const options = { algorithm: 'HS256', issuer, audience };
  const refreshToken = jwt.sign({ sub: user.id, kind: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    ...options,
    expiresIn: '7d',
    jwtid: crypto.randomUUID(),
  });
  const accessToken = jwt.sign(
    { sub: user.id, kind: 'access', sid: hashToken(refreshToken) },
    process.env.JWT_ACCESS_SECRET,
    { ...options, expiresIn: '15m' },
  );
  return { accessToken, refreshToken };
}

export function verifyToken(token, kind) {
  const decoded = jwt.verify(
    token,
    kind === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET,
    {
      algorithms: ['HS256'],
      issuer,
      audience,
    },
  );
  if (
    !decoded ||
    decoded.kind !== kind ||
    typeof decoded.sub !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(decoded.sub) ||
    (kind === 'access' && !/^[\da-f]{64}$/.test(decoded.sid))
  ) {
    throw new jwt.JsonWebTokenError('Invalid token claims');
  }
  return decoded;
}
