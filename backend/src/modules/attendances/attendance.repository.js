import pool from '../../database/pool.js';

const findAll = async ({ search = '', recordedBy }) => {
  const values = [];
  const conditions = ["attendance.status IN ('present', 'late')"];

  if (recordedBy) {
    values.push(recordedBy);
    conditions.push(`attendance.recorded_by = $${values.length}`);
  }

  if (search.trim()) {
    values.push(`%${search.trim()}%`);
    conditions.push(
      `(customer.name ILIKE $${values.length} OR staff.name ILIKE $${values.length})`,
    );
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const [data, summary] = await Promise.all([
    pool.query(
      `SELECT attendance.id,
         attendance.customer_id AS "customerId",
         customer.name AS "customerName",
         attendance.schedule_id AS "scheduleId",
         schedule.title AS "scheduleTitle",
         COALESCE(attendance.checked_in_at, attendance.created_at) AS "visitAt",
         attendance.status,
         attendance.recorded_by AS "recordedById",
         staff.name AS "recordedBy"
       FROM attendances attendance
       JOIN customers customer ON customer.id = attendance.customer_id
       JOIN schedules schedule ON schedule.id = attendance.schedule_id
       LEFT JOIN users staff ON staff.id = attendance.recorded_by
       ${whereClause}
       ORDER BY COALESCE(attendance.checked_in_at, attendance.created_at) DESC`,
      values,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS "totalVisits",
         COUNT(DISTINCT attendance.customer_id)::int AS "uniqueMembers",
         COUNT(DISTINCT attendance.recorded_by)
           FILTER (WHERE staff.role = 'staff')::int AS "recordingStaff"
       FROM attendances attendance
       LEFT JOIN users staff ON staff.id = attendance.recorded_by
       WHERE attendance.status IN ('present', 'late')
         ${recordedBy ? 'AND attendance.recorded_by = $1' : ''}`,
      recordedBy ? [recordedBy] : [],
    ),
  ]);

  return {
    attendances: data.rows,
    summary: summary.rows[0],
  };
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT attendance.id,
       attendance.customer_id AS "customerId",
       customer.name AS "customerName",
       attendance.schedule_id AS "scheduleId",
       schedule.title AS "scheduleTitle",
       COALESCE(attendance.checked_in_at, attendance.created_at) AS "visitAt",
       attendance.status,
       attendance.recorded_by AS "recordedById",
       staff.name AS "recordedBy"
     FROM attendances attendance
     JOIN customers customer ON customer.id = attendance.customer_id
     JOIN schedules schedule ON schedule.id = attendance.schedule_id
     LEFT JOIN users staff ON staff.id = attendance.recorded_by
     WHERE attendance.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const create = async ({ scheduleId, customerId, recordedBy }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const scheduleResult = await client.query(
      `SELECT id, type, customer_id AS "customerId", status
       FROM schedules
       WHERE id = $1
       FOR UPDATE`,
      [scheduleId],
    );
    if (!scheduleResult.rowCount || scheduleResult.rows[0].status === 'cancelled') {
      await client.query('ROLLBACK');
      return { invalidSchedule: true };
    }

    const customerResult = await client.query(
      `SELECT id
       FROM customers
       WHERE id = $1 AND status = 'active'
       FOR SHARE`,
      [customerId],
    );
    if (!customerResult.rowCount) {
      await client.query('ROLLBACK');
      return { invalidCustomer: true };
    }

    const schedule = scheduleResult.rows[0];
    if (schedule.type === 'personal_training' && schedule.customerId !== customerId) {
      await client.query('ROLLBACK');
      return { invalidCustomer: true };
    }

    if (schedule.type === 'group_class') {
      await client.query(
        `INSERT INTO schedule_members (schedule_id, customer_id)
         VALUES ($1, $2)
         ON CONFLICT (schedule_id, customer_id) DO NOTHING`,
        [scheduleId, customerId],
      );
    }

    const result = await client.query(
      `INSERT INTO attendances
         (schedule_id, customer_id, status, checked_in_at, recorded_by)
       VALUES ($1, $2, 'present', NOW(), $3)
       RETURNING id`,
      [scheduleId, customerId, recordedBy],
    );

    await client.query('COMMIT');
    return { attendance: await findById(result.rows[0].id) };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return { duplicate: true };
    }
    throw error;
  } finally {
    client.release();
  }
};

const AttendanceRepositories = { findAll, findById, create };
export default AttendanceRepositories;
