import DraftGeneratorService from './draft-generator.service.js';
import ReminderRepositories from './reminder.repository.js';
import response from '../../utils/response.js';

const getReminders = async (req, res, next) => {
  try {
    const reminders = await ReminderRepositories.findAll({
      ...req.validated,
      user: req.user,
    });
    return response.success(res, 'Reminders retrieved successfully', {
      reminders,
    });
  } catch (error) {
    next(error);
  }
};

const getReminderEvents = async (req, res, next) => {
  try {
    const events = await ReminderRepositories.findEvents(req.params.id, req.user);
    return response.success(res, 'Reminder history retrieved successfully', {
      events,
    });
  } catch (error) {
    next(error);
  }
};

const reviewReminder = async (req, res, next) => {
  try {
    const result = await ReminderRepositories.review({
      id: req.params.id,
      ...req.validated,
      assignedTo: req.validated.assigned_to,
      actorId: req.user.id,
    });
    if (result.notFound) return response.error(res, 'Reminder not found', 404);
    if (result.cancelled) {
      return response.error(res, 'Cancelled reminder cannot be approved or edited', 409);
    }
    if (result.notSchedulable) {
      return response.error(res, 'Only scheduled reminders can be reviewed', 409);
    }
    if (result.contactDenied) {
      return response.error(res, 'Contact permission is denied; reminder cannot be approved', 409);
    }
    if (result.invalidAssignee) {
      return response.error(res, 'Assignee must be an active Staff account', 400);
    }
    return response.success(res, 'Reminder review saved successfully', result);
  } catch (error) {
    next(error);
  }
};

const markReminderSent = async (req, res, next) => {
  try {
    const result = await ReminderRepositories.markSent({
      id: req.params.id,
      actor: req.user,
    });
    if (result.notFound) return response.error(res, 'Reminder not found', 404);
    if (result.forbidden) {
      return response.error(res, 'Only the assigned Staff can confirm manual delivery', 403);
    }
    if (result.notApproved) {
      return response.error(res, 'Reminder requires approval before delivery', 409);
    }
    if (result.contactDenied) {
      return response.error(res, 'Contact permission is denied', 409);
    }
    if (result.missingMessage) {
      return response.error(res, 'Reminder message is required', 400);
    }
    if (result.notDue) {
      return response.error(res, 'Reminder cannot be sent before its scheduled time', 409);
    }
    return response.success(res, 'Manual delivery confirmed by assigned Staff', result);
  } catch (error) {
    next(error);
  }
};

const setReminderResponse = async (req, res, next) => {
  try {
    const result = await ReminderRepositories.setResponse({
      id: req.params.id,
      responded: req.path.endsWith('/responded'),
      note: req.validated.note,
      actor: req.user,
    });
    if (result.notFound) return response.error(res, 'Reminder not found', 404);
    if (result.forbidden) {
      return response.error(res, 'Reminder is assigned to another user', 403);
    }
    if (result.notSent) {
      return response.error(
        res,
        'Only sent reminders can be marked as responded or no response',
        409,
      );
    }
    return response.success(res, 'Reminder response status updated', result);
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await ReminderRepositories.findNotifications(req.user.id);
    return response.success(res, 'Notifications retrieved successfully', {
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await ReminderRepositories.markNotificationRead(
      req.params.id,
      req.user.id,
    );
    if (!notification) {
      const exists = await ReminderRepositories.findNotificationById(req.params.id);
      return response.error(
        res,
        exists ? 'Notification belongs to another user' : 'Notification not found',
        exists ? 403 : 404,
      );
    }
    return response.success(res, 'Notification marked as read', {
      notification,
    });
  } catch (error) {
    next(error);
  }
};

const getDraftGeneratorStatus = async (req, res) => {
  const status = await DraftGeneratorService.getDraftGeneratorStatus();
  return response.success(res, 'Draft generator status retrieved', status);
};

export {
  getReminders,
  getReminderEvents,
  reviewReminder,
  markReminderSent,
  setReminderResponse,
  getNotifications,
  markNotificationRead,
  getDraftGeneratorStatus,
};
