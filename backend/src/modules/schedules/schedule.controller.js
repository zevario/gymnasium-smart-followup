import ScheduleRepositories from './schedule.repository.js';
import response from '../../utils/response.js';

const getSchedules = async (req, res, next) => {
  try {
    const schedules = await ScheduleRepositories.findAll(req.validated);
    return response.success(res, 'Schedules retrieved successfully', {
      schedules,
    });
  } catch (error) {
    next(error);
  }
};

const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await ScheduleRepositories.findById(req.params.id);
    if (!schedule) return response.error(res, 'Schedule not found', 404);
    return response.success(res, 'Schedule retrieved successfully', {
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const result = await ScheduleRepositories.create(req.validated, req.user.id);
    if (result.invalidCustomer) {
      return response.error(res, 'Schedule members must be active customers', 400);
    }
    return response.success(
      res,
      'Schedule created successfully',
      { schedule: result.schedule },
      201,
    );
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const result = await ScheduleRepositories.update(req.params.id, req.validated);
    if (result.notFound) return response.error(res, 'Schedule not found', 404);
    if (result.invalidCustomer) {
      return response.error(res, 'Schedule members must be active customers', 400);
    }
    if (result.attendanceConflict) {
      return response.error(
        res,
        'Schedule members with attendance records cannot be removed or reassigned',
        409,
      );
    }
    return response.success(res, 'Schedule updated successfully', {
      schedule: result.schedule,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const result = await ScheduleRepositories.remove(req.params.id);
    if (result.attendanceConflict) {
      return response.error(res, 'Schedule has attendance history and cannot be deleted', 409);
    }
    if (result.reminderConflict) {
      return response.error(
        res,
        'Schedule has reminder history and cannot be deleted; cancel it to preserve the history',
        409,
      );
    }
    if (!result.deleted) return response.error(res, 'Schedule not found', 404);
    return response.success(res, 'Schedule deleted successfully', {
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

export { getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule };
