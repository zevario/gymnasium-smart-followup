import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes/index.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use((req, res) => {
  return res.status(404).json({
    status: 'fail',
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
