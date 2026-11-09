import FollowupRepositories from './followup.repository.js';
import RecommendationRepositories from './recommendation.repository.js';
import DraftGeneratorService from '../reminders/draft-generator.service.js';
import response from '../../utils/response.js';

const getFollowups = async (req, res, next) => {
  try {
    const followUps = await FollowupRepositories.findAll({
      ...req.validated,
      user: req.user,
    });
    return response.success(res, 'Follow-ups retrieved successfully', {
      followUps,
    });
  } catch (error) {
    next(error);
  }
};

const getFollowupHistory = async (req, res, next) => {
  try {
    const events = await FollowupRepositories.findHistory(req.params.customerId, req.user);
    return response.success(res, 'Follow-up history retrieved successfully', {
      events,
    });
  } catch (error) {
    next(error);
  }
};

const updateFollowupStatus = async (req, res, next) => {
  try {
    const result = await FollowupRepositories.updateStatus({
      customerId: req.params.customerId,
      status: req.validated.status,
      actor: req.user,
    });

    if (result.notFound) {
      return response.error(res, 'Active customer not found', 404);
    }
    if (result.blocked) {
      return response.error(
        res,
        'Contact permission is denied; follow-up status cannot be changed',
        409,
      );
    }
    if (result.noActiveFollowup) {
      return response.error(res, 'No active follow-up task exists', 404);
    }
    if (result.forbidden) {
      return response.error(res, 'Follow-up is assigned to another Staff member', 403);
    }
    if (result.invalidTransition) {
      return response.error(res, 'Staff cannot set this follow-up status', 403);
    }

    return response.success(res, 'Follow-up status updated successfully', {
      status: result.status,
      eventId: result.eventId,
    });
  } catch (error) {
    next(error);
  }
};

const createFollowupActivity = async (req, res, next) => {
  try {
    const event = await FollowupRepositories.createActivity({
      customerId: req.params.customerId,
      ...req.validated,
      actor: req.user,
    });

    if (event.notFound) {
      return response.error(res, 'Active customer not found', 404);
    }
    if (event.blocked) {
      return response.error(res, 'Contact permission is denied; activity cannot be recorded', 409);
    }
    if (event.noActiveFollowup) {
      return response.error(res, 'No active follow-up task exists', 404);
    }
    if (event.forbidden) {
      return response.error(res, 'Follow-up is assigned to another Staff member', 403);
    }

    return response.success(res, 'Follow-up activity created successfully', { event }, 201);
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await RecommendationRepositories.findAllRecommendations();
    return response.success(res, 'Follow-up recommendations retrieved', {
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

const getDraftGeneratorStatus = async (req, res) => {
  const status = await DraftGeneratorService.getDraftGeneratorStatus();
  return response.success(res, 'Follow-up draft generator status retrieved', status);
};

const reviewRecommendation = async (req, res, next) => {
  try {
    const result = await RecommendationRepositories.reviewRecommendation({
      id: req.params.id,
      decision: req.params.decision,
      assignedTo: req.validated.assigned_to,
      draftMessage: req.validated.draft_message,
      note: req.validated.note,
      actorId: req.user.id,
    });
    if (result.notFound) return response.error(res, 'Recommendation not found', 404);
    if (result.alreadyReviewed) {
      return response.error(res, 'Recommendation has already been reviewed', 409);
    }
    if (result.invalidAssignee) {
      return response.error(res, 'Assignee must be an active Staff account', 400);
    }
    if (result.contactDenied) {
      return response.error(res, 'Contact permission is denied or customer is inactive', 409);
    }
    return response.success(res, 'Recommendation reviewed successfully', result);
  } catch (error) {
    next(error);
  }
};

const dismissRecommendation = async (req, res, next) => {
  try {
    const result = await RecommendationRepositories.reviewRecommendation({
      id: req.params.id,
      decision: 'dismiss',
      note: req.validated.note,
      actorId: req.user.id,
    });
    if (result.notFound) return response.error(res, 'Recommendation not found', 404);
    if (result.alreadyReviewed) {
      return response.error(res, 'Recommendation has already been reviewed', 409);
    }
    return response.success(res, 'Recommendation dismissed', result);
  } catch (error) {
    next(error);
  }
};

export {
  getFollowups,
  getFollowupHistory,
  updateFollowupStatus,
  createFollowupActivity,
  getRecommendations,
  getDraftGeneratorStatus,
  reviewRecommendation,
  dismissRecommendation,
};
