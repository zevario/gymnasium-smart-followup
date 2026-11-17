import express from 'express';
import Joi from 'joi';
import { FEATURES, CLASSES, predict } from './features.js';
import { createRequestLimiter } from '../src/middleware/rate-limit.js';

const count = Joi.number().integer().min(0).max(1000000).required();
const ratio = Joi.number().min(0).max(1).allow(null).required();
const customerSchema = Joi.object({
  customerId: Joi.string().trim().min(1).max(100).required(),
  visits30Days: count,
  daysSinceLastVisit: count.allow(null),
  attendanceRatio: ratio,
  reschedules: count,
  noResponses: count,
  responseRatio: ratio,
  remainingSessions: count.allow(null),
  daysToExpiry: Joi.number().integer().min(-100000).max(100000).allow(null).required(),
});
const requestSchema = Joi.object({
  customers: Joi.array().items(customerSchema).min(1).max(500).unique('customerId').required(),
});

export function validateModel(model) {
  if (
    model.algorithm !== 'multinomial-logistic-regression' ||
    JSON.stringify(model.features) !== JSON.stringify(FEATURES) ||
    JSON.stringify(model.classes) !== JSON.stringify(CLASSES) ||
    typeof model.modelVersion !== 'string' ||
    !model.modelVersion ||
    !Array.isArray(model.weights) ||
    model.weights.length !== 3 ||
    model.weights.some(
      (row) => !Array.isArray(row) || row.length !== 17 || row.some((v) => !Number.isFinite(v)),
    ) ||
    ['medians', 'means', 'scales'].some(
      (key) =>
        !Array.isArray(model.preprocessing?.[key]) ||
        model.preprocessing[key].length !== 8 ||
        model.preprocessing[key].some((v) => !Number.isFinite(v)),
    ) ||
    model.preprocessing.scales.some((v) => v <= 0)
  )
    throw new Error('Invalid priority model artifact; run npm run ml:train.');
  return model;
}

export function createInferenceApp(model) {
  validateModel(model);
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/health', (_req, res) =>
    res.json({
      status: 'ok',
      modelVersion: model.modelVersion,
      syntheticTraining: model.syntheticTraining,
      features: FEATURES,
      classes: CLASSES,
    }),
  );
  app.use(createRequestLimiter({ limit: 120 }));
  app.use(express.json({ limit: '1mb' }));
  app.post('/predict', (req, res) => {
    const { error, value } = requestSchema.validate(req.body, { convert: false });
    if (error) return res.status(400).json({ message: error.details[0].message });
    res.json({
      modelVersion: model.modelVersion,
      syntheticTraining: model.syntheticTraining,
      predictions: value.customers.map((row) => predict(model, row)),
    });
  });
  app.use((_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({
      message: status === 500 ? 'Inference gagal.' : 'Body JSON tidak valid atau terlalu besar.',
    });
  });
  return app;
}
