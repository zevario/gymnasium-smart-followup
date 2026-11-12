import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';
import {
  createFollowupActivity,
  dismissRecommendation,
  getDraftGeneratorStatus,
  getFollowupHistory,
  getFollowups,
  getRecommendations,
  reviewRecommendation,
  updateFollowupStatus,
} from './followup.controller.js';
import {
  createFollowupActivitySchema,
  approveRecommendationSchema,
  customerIdSchema,
  dismissRecommendationSchema,
  listFollowupsSchema,
  recommendationIdSchema,
  updateFollowupStatusSchema,
} from './followup.schema.js';

const router = Router();

const validateCustomerId = validate(customerIdSchema, 'params');

router.use(authentication, authorization('admin', 'spv', 'staff'));
router.get('/recommendations', authorization('admin', 'spv'), getRecommendations);
router.get('/draft-status', getDraftGeneratorStatus);
router.post(
  '/recommendations/:id/approve',
  authorization('admin', 'spv'),
  validate(recommendationIdSchema, 'params'),
  validate(approveRecommendationSchema),
  reviewRecommendation,
);
router.post(
  '/recommendations/:id/dismiss',
  authorization('admin', 'spv'),
  validate(recommendationIdSchema, 'params'),
  validate(dismissRecommendationSchema),
  dismissRecommendation,
);
router.get('/', validate(listFollowupsSchema, 'query'), getFollowups);
router.get('/:customerId/history', validateCustomerId, getFollowupHistory);
router.patch(
  '/:customerId/status',
  authorization('admin', 'spv', 'staff'),
  validateCustomerId,
  validate(updateFollowupStatusSchema),
  updateFollowupStatus,
);
router.post(
  '/:customerId/activities',
  authorization('admin', 'spv', 'staff'),
  validateCustomerId,
  validate(createFollowupActivitySchema),
  createFollowupActivity,
);

export default router;
