import pool from '../../database/pool.js';

const findAll = async ({ status, approval_status, search = '', user }) => {
  const values = [];
  const conditions = [];

  if (user.role === 'staff') {
    values.push(user.id);
    conditions.push(`reminder.assigned_to = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`reminder.status = $${values.length}`);
  }
  if (approval_status) {
    values.push(approval_status);
    conditions.push(`reminder.approval_status = $${values.length}`);
  }
  if (search.trim()) {
    values.push(`%${search.trim()}%`);
    conditions.push(
      `(customer.name ILIKE $${values.length} OR customer.phone ILIKE $${values.length} OR schedule.title ILIKE $${values.length})`,
    );
  }

  const result = await pool.query(
    `SELECT reminder.id,
       reminder.customer_id AS "customerId",
       customer.name AS "customerName",
       customer.phone,
       customer.membership_package AS "membershipPackage",
       reminder.schedule_id AS "scheduleId",
       schedule.title AS "scheduleTitle",
       schedule.starts_at AS "scheduleStartsAt",
       reminder.type,
       reminder.channel,
       reminder.message,
       reminder.status,
       reminder.lead_minutes AS "leadMinutes",
       reminder.approval_status AS "approvalStatus",
       reminder.scheduled_at AS "scheduledAt",
       reminder.sent_at AS "sentAt",
       reminder.responded_at AS "respondedAt",
       reminder.assigned_to AS "assignedTo",
       assignee.name AS "assignedToName",
       assignee.role AS "assignedToRole",
       reminder.approved_by AS "approvedBy",
       approver.name AS "approvedByName",
       reminder.approved_at AS "approvedAt",
       reminder.sent_by AS "sentBy",
       sender.name AS "sentByName",
       customer.pic_id AS "picId",
       pic.name AS "picName",
       pic.role AS "picRole",
       reminder.created_at AS "createdAt",
       reminder.updated_at AS "updatedAt"
     FROM reminders reminder
     JOIN customers customer ON customer.id = reminder.customer_id
     LEFT JOIN schedules schedule ON schedule.id = reminder.schedule_id
     LEFT JOIN users assignee ON assignee.id = reminder.assigned_to
     LEFT JOIN users approver ON approver.id = reminder.approved_by
     LEFT JOIN users sender ON sender.id = reminder.sent_by
     LEFT JOIN users pic
       ON pic.id = customer.pic_id
       AND pic.is_active = TRUE
       AND pic.role IN ('spv', 'staff')
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY reminder.scheduled_at NULLS LAST, reminder.created_at DESC`,
    values,
  );
  return result.rows;
};

const findByIdForUpdate = async (client, id) => {
  const result = await client.query(
    `SELECT reminder.*,
       customer.name AS customer_name,
       customer.pic_id,
       customer.contact_permission,
       schedule.title AS schedule_title,
       schedule.starts_at AS schedule_starts_at
     FROM reminders reminder
     JOIN customers customer ON customer.id = reminder.customer_id
     LEFT JOIN schedules schedule ON schedule.id = reminder.schedule_id
     WHERE reminder.id = $1
     FOR UPDATE OF reminder`,
    [id],
  );
  return result.rows[0] || null;
};

const appendEvent = async (
  client,
  reminder,
  { eventType, previousStatus, newStatus, approvalStatus, message, note, actorId },
) => {
  await client.query(
    `INSERT INTO reminder_events
       (reminder_id, customer_id, pic_id, event_type, previous_status,
        new_status, approval_status, message_snapshot, note, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      reminder.id,
      reminder.customer_id,
      reminder.pic_id,
      eventType,
      previousStatus || null,
      newStatus || null,
      approvalStatus || null,
      message ?? null,
      note || null,
      actorId || null,
    ],
  );
};

const review = async ({ id, message, decision, assignedTo, note, actorId }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reminder = await findByIdForUpdate(client, id);
    if (!reminder) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }
    if (reminder.status === 'cancelled') {
      await client.query('ROLLBACK');
      return { cancelled: true };
    }
    if (reminder.status !== 'scheduled') {
      await client.query('ROLLBACK');
      return { notSchedulable: true };
    }
    if (decision === 'approve' && !reminder.contact_permission) {
      await client.query('ROLLBACK');
      return { contactDenied: true };
    }
    if (decision === 'approve') {
      const assignee = await client.query(
        `SELECT id FROM users
         WHERE id = $1 AND role = 'staff' AND is_active = TRUE`,
        [assignedTo],
      );
      if (!assignee.rowCount) {
        await client.query('ROLLBACK');
        return { invalidAssignee: true };
      }
    }

    const approvalStatus = decision === 'approve' ? 'approved' : 'rejected';
    if (decision === 'approve') {
      await client.query(
        `UPDATE reminders
         SET message = $1, approval_status = 'approved',
             assigned_to = $2, approved_by = $3, approved_at = NOW(),
             updated_at = NOW()
         WHERE id = $4`,
        [message, assignedTo, actorId, id],
      );
    } else {
      await client.query(
        `UPDATE reminders
         SET message = $1, approval_status = 'rejected',
             approved_by = NULL, approved_at = NULL, updated_at = NOW()
         WHERE id = $2`,
        [message, id],
      );
    }
    await appendEvent(client, reminder, {
      eventType: decision === 'approve' ? 'approved' : 'rejected',
      previousStatus: reminder.status,
      newStatus: reminder.status,
      approvalStatus,
      message,
      note,
      actorId,
    });
    if (decision === 'approve' && reminder.assigned_to !== assignedTo) {
      await client.query(
        `INSERT INTO reminder_events
           (reminder_id, customer_id, pic_id, event_type, previous_status,
            new_status, approval_status, note, performed_by)
         VALUES ($1, $2, $3, 'assigned', $4, $5, 'approved', $6, $7)`,
        [
          reminder.id,
          reminder.customer_id,
          assignedTo,
          reminder.status,
          reminder.status,
          'Reminder ditugaskan kepada Staff.',
          actorId,
        ],
      );
    }
    await client.query('COMMIT');
    return { approvalStatus };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const markSent = async ({ id, actor }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reminder = await findByIdForUpdate(client, id);
    if (!reminder) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }
    if (reminder.status !== 'scheduled' || reminder.approval_status !== 'approved') {
      await client.query('ROLLBACK');
      return { notApproved: true };
    }
    if (!reminder.contact_permission) {
      await client.query('ROLLBACK');
      return { contactDenied: true };
    }
    if (!reminder.message?.trim()) {
      await client.query('ROLLBACK');
      return { missingMessage: true };
    }
    if (reminder.scheduled_at && new Date(reminder.scheduled_at) > new Date()) {
      await client.query('ROLLBACK');
      return { notDue: true };
    }
    if (actor.role !== 'staff' || reminder.assigned_to !== actor.id) {
      await client.query('ROLLBACK');
      return { forbidden: true };
    }

    await client.query(
      `UPDATE reminders
       SET status = 'sent', sent_at = NOW(), sent_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [actor.id, id],
    );
    await appendEvent(client, reminder, {
      eventType: 'staff_approved',
      previousStatus: 'scheduled',
      newStatus: 'scheduled',
      approvalStatus: 'approved',
      message: reminder.message,
      note: 'Staff confirmed manual delivery.',
      actorId: actor.id,
    });
    await appendEvent(client, reminder, {
      eventType: 'sent',
      previousStatus: 'scheduled',
      newStatus: 'sent',
      approvalStatus: 'approved',
      message: reminder.message,
      note: 'Manual delivery confirmed by staff.',
      actorId: actor.id,
    });
    await client.query('COMMIT');
    return { status: 'sent' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const setResponse = async ({ id, responded, note, actor }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reminder = await findByIdForUpdate(client, id);
    if (!reminder) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }
    if (reminder.status !== 'sent' && reminder.status !== 'no_response') {
      await client.query('ROLLBACK');
      return { notSent: true };
    }
    if (actor.role === 'staff' && reminder.assigned_to !== actor.id) {
      await client.query('ROLLBACK');
      return { forbidden: true };
    }
    const nextStatus = responded ? 'responded' : 'no_response';
    const previousStatus = reminder.status;
    await client.query(
      `UPDATE reminders
       SET status = $1,
           responded_at = CASE WHEN $1 = 'responded' THEN NOW() ELSE responded_at END,
           updated_at = NOW()
       WHERE id = $2`,
      [nextStatus, id],
    );
    await appendEvent(client, reminder, {
      eventType: nextStatus,
      previousStatus,
      newStatus: nextStatus,
      approvalStatus: reminder.approval_status,
      message: reminder.message,
      note,
      actorId: actor.id,
    });
    await client.query('COMMIT');
    return { status: nextStatus };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findEvents = async (id, actor) => {
  const values = [id];
  const conditions = ['event.reminder_id = $1'];
  if (actor.role === 'staff') {
    values.push(actor.id);
    conditions.push(`reminder.assigned_to = $${values.length}`);
  }
  const result = await pool.query(
    `SELECT event.id,
       event.customer_id AS "customerId",
       customer.name AS "customerName",
       event.pic_id AS "picId",
       pic.name AS "picName",
       event.event_type AS "eventType",
       event.previous_status AS "previousStatus",
       event.new_status AS "newStatus",
       event.approval_status AS "approvalStatus",
       event.message_snapshot AS message,
       event.note,
       event.created_at AS "createdAt",
       event.performed_by AS "performedById",
       actor.name AS "performedBy"
     FROM reminder_events event
     JOIN reminders reminder ON reminder.id = event.reminder_id
     JOIN customers customer ON customer.id = event.customer_id
     LEFT JOIN users pic ON pic.id = event.pic_id
     LEFT JOIN users actor ON actor.id = event.performed_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY event.created_at DESC, event.id DESC`,
    values,
  );
  return result.rows;
};

const findNotifications = async (userId) => {
  const result = await pool.query(
    `SELECT id,
       notification_type AS type,
       notification_date AS date,
       title,
       payload,
       read_at AS "readAt",
       created_at AS "createdAt"
     FROM staff_notifications
     WHERE user_id = $1
     ORDER BY notification_date DESC, created_at DESC
     LIMIT 30`,
    [userId],
  );
  return result.rows;
};

const markNotificationRead = async (id, userId) => {
  const result = await pool.query(
    `UPDATE staff_notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2
     RETURNING id, read_at AS "readAt"`,
    [id, userId],
  );
  return result.rows[0] || null;
};

const findNotificationById = async (id) => {
  const result = await pool.query('SELECT id FROM staff_notifications WHERE id = $1', [id]);
  return result.rowCount > 0;
};

const ReminderRepositories = {
  findAll,
  review,
  markSent,
  setResponse,
  findEvents,
  findNotifications,
  markNotificationRead,
  findNotificationById,
};

export default ReminderRepositories;
