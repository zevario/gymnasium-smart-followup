import { rateLimit } from 'express-rate-limit';

export function createRequestLimiter({
  limit,
  windowMs = 15 * 60 * 1000,
  skipSuccessfulRequests = false,
}) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Terlalu banyak permintaan. Coba lagi setelah beberapa saat.',
    },
  });
}

export const apiLimiter = createRequestLimiter({ limit: 300, windowMs: 60 * 1000 });
export const loginLimiter = createRequestLimiter({ limit: 10, skipSuccessfulRequests: true });
export const refreshLimiter = createRequestLimiter({ limit: 60 });
export const passwordLimiter = createRequestLimiter({ limit: 10 });
