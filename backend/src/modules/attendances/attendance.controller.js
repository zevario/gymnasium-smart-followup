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

    // Kehadiran tetap tercatat meski pelanggan tidak punya paket yang cocok.
    // Petugas diberi tahu lewat `sessionWarning` agar bisa menindaklanjuti.
    return response.success(
      res,
      'Attendance recorded successfully',
      {
        attendance: result.attendance,
        sessionUsage: result.sessionUsage,
        sessionWarning: result.sessionUsage ? null : 'no_active_package',
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

const updateAttendanceStatus = async (req, res, next) => {
  try {
    const result = await AttendanceRepositories.updateStatus({
      id: req.params.id,
      status: req.validated.status,
    });

    if (result.notFound) {
      return response.error(res, 'Attendance record not found', 404);
    }

    return response.success(res, 'Attendance status updated successfully', {
      attendance: result.attendance,
      sessionUsage: result.sessionUsage,
    });
  } catch (error) {
    next(error);
  }
};

export { getAttendances, createAttendance, updateAttendanceStatus };
