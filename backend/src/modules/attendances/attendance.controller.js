import AttendanceRepositories from './attendance.repository.js';
import response from '../../utils/response.js';

const getAttendances = async (req, res, next) => {
  try {
    const result = await AttendanceRepositories.findAll({
      ...req.validated,
      recordedBy: req.user.role === 'staff' ? req.user.id : undefined,
    });
    return response.success(res, 'Attendance records retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const createAttendance = async (req, res, next) => {
  try {
    const result = await AttendanceRepositories.create({
      scheduleId: req.validated.schedule_id,
      customerId: req.validated.customer_id,
      recordedBy: req.user.id,
    });

    if (result.invalidSchedule) {
      return response.error(res, 'Schedule not found or cancelled', 400);
    }
    if (result.invalidCustomer) {
      return response.error(
        res,
        'Customer is inactive or is not assigned to this training schedule',
        400,
      );
    }
    if (result.duplicate) {
      return response.error(
        res,
        'This customer already has an attendance record for the schedule',
        409,
      );
    }

    return response.success(
      res,
      'Attendance recorded successfully',
      { attendance: result.attendance },
      201,
    );
  } catch (error) {
    next(error);
  }
};

export { getAttendances, createAttendance };
