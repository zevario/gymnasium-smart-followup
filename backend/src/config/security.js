import 'dotenv/config';

export function validateSecurityEnvironment(env = process.env) {
  const secrets = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET];
  if (secrets.some((secret) => !secret) || secrets[0] === secrets[1]) {
    throw new Error('Configure two distinct JWT secrets.');
  }
  if (env.NODE_ENV === 'production') {
    if (secrets.some((secret) => secret.length < 32 || /replace|example|changeme/i.test(secret))) {
      throw new Error('Production JWT secrets must be random values of at least 32 characters.');
    }
    if (
      !env.FRONTEND_URL ||
      env.FRONTEND_URL.split(',').some((origin) => {
        try {
          return new URL(origin.trim()).protocol !== 'https:';
        } catch {
          return true;
        }
      })
    )
      throw new Error('Configure HTTPS FRONTEND_URL origins for production.');
  }
}

export function configureSecurity(app) {
  validateSecurityEnvironment();
  app.disable('x-powered-by');
  // Only trust explicitly configured proxy IPs/subnets, never arbitrary client forwarding headers.
  if (process.env.TRUST_PROXY)
    app.set(
      'trust proxy',
      process.env.TRUST_PROXY.split(',').map((v) => v.trim()),
    );
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
}
