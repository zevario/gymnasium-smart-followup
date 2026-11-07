import pool from '../../../config/database.js';
import ReminderSchedulerService from '../../reminders/services/reminder-scheduler-service.js';

const selectSchedule = `
  SELECT schedule.id,
    schedule.title,
    schedule.description,
    schedule.type,
    schedule.customer_id AS "customerId",
    training_customer.name AS "customerName",
    schedule.trainer_name AS "trainerName",
    schedule.location,
    schedule.starts_at AS "startsAt",
    schedule.ends_at AS "endsAt",
    schedule.status,
    schedule.reminder_2h_enabled AS "reminder2hEnabled",
    schedule.created_by AS "createdBy",
    schedule.created_at AS "createdAt",
    schedule.updated_at AS "updatedAt",
    COALESCE(
      json_agg(DISTINCT jsonb_build_object('id', member.id, 'name', member.name))
        FILTER (WHERE member.id IS NOT NULL),
      '[]'::json
    ) AS members
  FROM schedules schedule
  LEFT JOIN customers training_customer
    ON training_customer.id = schedule.customer_id
  LEFT JOIN schedule_members schedule_member
    ON schedule_member.schedule_id = schedule.id
  LEFT JOIN customers member
    ON member.id = schedule_member.customer_id
`;

const groupBySchedule = `
  GROUP BY schedule.id, training_customer.name
`;

const findAll = async ({ upcoming = false }) => {
  const whereClause = upcoming
    ? "WHERE schedule.status = 'scheduled' AND schedule.ends_at >= NOW()"
    : '';
  const order = upcoming
    ? 'ORDER BY schedule.starts_at ASC'
    : 'ORDER BY schedule.starts_at DESC';
  const result = await pool.query(
    `${selectSchedule} ${whereClause} ${groupBySchedule} ${order}`,
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    `${selectSchedule} WHERE schedule.id = $1 ${groupBySchedule}`,
    [id],
  );
  return result.rows[0] || null;
};

const validateCustomers = async (client, ids) => {
  if (!ids.length) return true;
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM customers
     WHERE id = ANY($1::uuid[]) AND status = 'active'`,
    [ids],
  );
  return result.rows[0].count === ids.length;
};

const addMembers = async (client, scheduleId, ids) => {
  for (const customerId of ids) {
    await client.query(
      `INSERT INTO schedule_members (schedule_id, customer_id)
       VALUES ($1, $2)
       ON CONFLICT (schedule_id, customer_id) DO NOTHING`,
      [scheduleId, customerId],
    );
  }
};

const create = async (data, createdBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const customerIds = data.type === 'group_class'
      ? data.member_ids || []
      : [data.customer_id];
    if (!(await validateCustomers(client, customerIds))) {
      await client.query('ROLLBACK');
      return { invalidCustomer: true };
    }

    const result = await client.query(
      `INSERT INTO schedules
         (title, description, type, customer_id, trainer_name, location,
          starts_at, ends_at, status, reminder_2h_enabled, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.title,
        data.description || null,
        data.type,
        data.type === 'personal_training' ? data.customer_id : null,
        data.trainer_name || null,
        data.location || null,
        data.starts_at,
        data.ends_at,
        data.status || 'scheduled',
        data.reminder_2h_enabled || false,
        createdBy,
      ],
    );

    if (data.type === 'group_class') {
      await addMembers(client, result.rows[0].id, data.member_ids || []);
    }
    await ReminderSchedulerService.reconcileScheduleReminders(
      client,
      result.rows[0].id,
    );
    await client.query('COMMIT');
    return { schedule: await findById(result.rows[0].id) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query(
      `SELECT id, type, customer_id AS "customerId",
         title, description, trainer_name, location, starts_at, ends_at, status,
         reminder_2h_enabled
       FROM schedules WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!existingResult.rowCount) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }

    const scheduleType = data.type;
    const memberIds = scheduleType === 'group_class'
      ? data.member_ids || []
      : [];
    const customerIds = scheduleType === 'personal_training'
      ? [data.customer_id]
      : memberIds;
    if (!(await validateCustomers(client, customerIds))) {
      await client.query('ROLLBACK');
      return { invalidCustomer: true };
    }

    const attendedResult = await client.query(
      `SELECT customer_id
       FROM attendances
       WHERE schedule_id = $1 AND status IN ('present', 'late')`,
      [id],
    );
    if (
      attendedResult.rows.some(
        (attendance) => !memberIds.includes(attendance.customer_id)
          && scheduleType === 'group_class',
      )
      || (
        scheduleType === 'personal_training'
        && attendedResult.rows.length
        && existingResult.rows[0].customerId !== data.customer_id
      )
    ) {
      await client.query('ROLLBACK');
      return { attendanceConflict: true };
    }

    await client.query(
      `UPDATE schedules
       SET title = $1, description = $2, type = $3, customer_id = $4,
           trainer_name = $5, location = $6, starts_at = $7, ends_at = $8,
           status = $9, reminder_2h_enabled = $10, updated_at = NOW()
       WHERE id = $11`,
      [
        data.title,
        data.description || null,
        scheduleType,
        scheduleType === 'personal_training' ? data.customer_id : null,
        data.trainer_name || null,
        data.location || null,
        data.starts_at,
        data.ends_at,
        data.status,
        data.reminder_2h_enabled || false,
        id,
      ],
    );

    if (scheduleType === 'group_class') {
      await client.query(
        `DELETE FROM schedule_members
         WHERE schedule_id = $1
           AND NOT (customer_id = ANY($2::uuid[]))
           AND NOT EXISTS (
             SELECT 1 FROM attendances
             WHERE schedule_id = $1 AND customer_id = schedule_members.customer_id
           )`,
        [id, memberIds],
      );
      await addMembers(client, id, memberIds);
    } else {
      await client.query(
        `DELETE FROM schedule_members
         WHERE schedule_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM attendances
             WHERE schedule_id = $1 AND customer_id = schedule_members.customer_id
           )`,
        [id],
      );
    }

    const existing = existingResult.rows[0];
    const invalidateDraft = existing.title !== data.title
      || existing.description !== (data.description || null)
      || existing.trainer_name !== (data.trainer_name || null)
      || existing.location !== (data.location || null)
      || new Date(existing.starts_at).getTime() !== new Date(data.starts_at).getTime()
      || existing.reminder_2h_enabled !== (data.reminder_2h_enabled || false);
    await ReminderSchedulerService.reconcileScheduleReminders(
      client,
      id,
      { invalidateDraft },
    );
    await client.query('COMMIT');
    return { schedule: await findById(id) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const schedule = await client.query(
      'SELECT id FROM schedules WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!schedule.rowCount) {
      await client.query('ROLLBACK');
      return { deleted: false };
    }
    const reminders = await client.query(
      `SELECT EXISTS(
         SELECT 1 FROM reminders WHERE schedule_id = $1
       ) AS has_reminders`,
      [id],
    );
    if (reminders.rows[0].has_reminders) {
      await client.query('ROLLBACK');
      return { reminderConflict: true };
    }
    const result = await client.query(
      `SELECT EXISTS(
         SELECT 1 FROM attendances WHERE schedule_id = $1
       ) AS has_attendance`,
      [id],
    );
    if (result.rows[0].has_attendance) {
      await client.query('ROLLBACK');
      return { attendanceConflict: true };
    }
    const deleted = await client.query(
      'DELETE FROM schedules WHERE id = $1 RETURNING id',
      [id],
    );
    await client.query('COMMIT');
    return { deleted: deleted.rowCount > 0 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const ScheduleRepositories = { findAll, findById, create, update, remove };
export default ScheduleRepositories;
