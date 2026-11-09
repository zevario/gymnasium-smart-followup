import express from 'express';
import { configureSecurity } from './config/security.js';
import { apiLimiter } from './middleware/rate-limit.js';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes/index.js';
import errorHandler from './middleware/error-handler.js';

const app = express();
configureSecurity(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(Object.assign(new Error('Origin not allowed by CORS'), { statusCode: 403 }));
    },
    credentials: true,
  }),
);

app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb', parameterLimit: 100 }));

app.use('/api', routes);

app.use((req, res) => {
  return res.status(404).json({
    status: 'fail',
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
