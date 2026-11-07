import pool from '../../../config/database.js';

const findAll = async ({ search = '', user }) => {
  const values = [];
  const conditions = ["c.status = 'active'"];

  if (search.trim()) {
    values.push(`%${search.trim()}%`);
    conditions.push(`(
      c.name ILIKE $1 OR c.phone ILIKE $1 OR
      c.membership_package ILIKE $1 OR pic.name ILIKE $1
    )`);
  }
  if (user?.role === 'staff') {
    values.push(user.id);
    conditions.push(`latest_followups.assigned_to = $${values.length}`);
    conditions.push(
      "latest_followups.status IN ('pending', 'in_progress', 'no_response', 'postponed')",
    );
  }

  const result = await pool.query(
    `WITH latest_followups AS (
       SELECT DISTINCT ON (customer_id)
         id, customer_id, status, priority, assigned_to, draft_message
       FROM followups
       ORDER BY customer_id,
         CASE WHEN status IN ('pending', 'in_progress', 'no_response', 'postponed')
           THEN 0 ELSE 1 END,
         updated_at DESC, created_at DESC
     ),
     visit_summary AS (
       SELECT customer_id,
         MAX(COALESCE(checked_in_at, created_at))
           FILTER (WHERE status IN ('present', 'late')) AS last_visit,
         COUNT(*) FILTER (
           WHERE status IN ('present', 'late')
             AND COALESCE(checked_in_at, created_at) >= NOW() - INTERVAL '30 days'
         )::int AS visits_last_30_days,
         COUNT(*) FILTER (
           WHERE status = 'absent'
             AND COALESCE(checked_in_at, created_at) >= NOW() - INTERVAL '30 days'
         )::int AS absences_last_30_days
       FROM attendances
       GROUP BY customer_id
     )
     SELECT
       c.id,
       c.name,
       c.phone,
       c.membership_package AS "membershipPackage",
       c.membership_end::text AS "membershipEnd",
       c.contact_permission AS "contactPermission",
       c.pic_id AS "picId",
       pic.name AS "picName",
       pic.role AS "picRole",
       latest_followups.id AS "followupId",
       latest_followups.assigned_to AS "assignedTo",
       assignee.name AS "assignedToName",
       latest_followups.draft_message AS "draftMessage",
       COALESCE(latest_followups.status, 'pending') AS status,
       COALESCE(recommendation.priority, latest_followups.priority) AS priority,
       recommendation.reason AS "priorityReason",
       recommendation.recommended_action AS "recommendedAction",
       recommendation.id AS "recommendationId",
       CASE
         WHEN recommendation.id IS NOT NULL OR latest_followups.priority IS NOT NULL
           THEN 'Rule-based scoring'
         ELSE 'Belum ada rekomendasi aktif'
       END AS "classificationMethod",
       visit_summary.last_visit AS "lastVisit",
       COALESCE(visit_summary.visits_last_30_days, 0) AS "visitsLast30Days",
       COALESCE(visit_summary.absences_last_30_days, 0) AS "absencesLast30Days",
       COALESCE(no_response_summary.count, 0) AS "noResponseCount",
       latest_reminder.status AS "lastReminderStatus",
       latest_reminder.responded_at AS "lastReminderRespondedAt"
     FROM customers c
     LEFT JOIN users pic
       ON pic.id = c.pic_id
       AND pic.is_active = TRUE
       AND pic.role IN ('spv', 'staff')
     LEFT JOIN latest_followups ON latest_followups.customer_id = c.id
     LEFT JOIN users assignee ON assignee.id = latest_followups.assigned_to
     LEFT JOIN LATERAL (
       SELECT id, priority, reason, recommended_action
       FROM followup_recommendations
       WHERE customer_id = c.id
         AND (
           status = 'pending'
           OR id = (
             SELECT followup_recommendation.id
             FROM followups followup
             JOIN followup_recommendations followup_recommendation
               ON followup_recommendation.followup_id = followup.id
             WHERE followup.id = latest_followups.id
             LIMIT 1
           )
         )
       ORDER BY created_at DESC
       LIMIT 1
     ) recommendation ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS count
       FROM reminders
       WHERE customer_id = c.id AND status = 'no_response'
     ) no_response_summary ON TRUE
     LEFT JOIN LATERAL (
       SELECT status, responded_at
       FROM reminders
       WHERE customer_id = c.id
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1
     ) latest_reminder ON TRUE
     LEFT JOIN visit_summary ON visit_summary.customer_id = c.id
     WHERE ${conditions.join(' AND ')}
       AND (
         latest_followups.id IS NOT NULL
         OR recommendation.id IS NOT NULL
         OR c.contact_permission = FALSE
       )
     ORDER BY c.created_at DESC`,
    values,
  );

  return result.rows;
};

const findHistory = async (customerId, user) => {
  const values = [customerId];
  const staffFilter = user?.role === 'staff'
    ? 'AND followup.assigned_to = $2'
    : '';
  if (user?.role === 'staff') values.push(user.id);
  const result = await pool.query(
    `SELECT
       event.id,
       event.event_type AS "eventType",
       event.previous_status AS "previousStatus",
       event.new_status AS "newStatus",
       event.channel,
       event.note,
       event.result,
       event.created_at AS "createdAt",
       event.performed_by AS "performedById",
       actor.name AS "performedBy",
       pic.name AS "picName",
       event.followup_id AS "followupId"
     FROM followup_events event
     LEFT JOIN followups followup ON followup.id = event.followup_id
     LEFT JOIN users actor ON actor.id = event.performed_by
     LEFT JOIN users pic ON pic.id = event.pic_id
     WHERE event.customer_id = $1 ${staffFilter}
     ORDER BY event.created_at DESC, event.id DESC`,
    values,
  );

  return result.rows;
};

const updateStatus = async ({ customerId, status, actor }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const customerResult = await client.query(
      `SELECT c.name, c.contact_permission, c.pic_id
       FROM customers c
       WHERE c.id = $1 AND c.status = 'active'
       FOR UPDATE OF c`,
      [customerId],
    );

    if (!customerResult.rowCount) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }

    const customer = customerResult.rows[0];
    if (!customer.contact_permission) {
      await client.query('ROLLBACK');
      return { blocked: true };
    }

    const currentResult = await client.query(
      `SELECT id, status, assigned_to
       FROM followups
       WHERE customer_id = $1
         AND status IN ('pending', 'in_progress', 'no_response', 'postponed')
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [customerId],
    );
    if (!currentResult.rowCount) {
      await client.query('ROLLBACK');
      return { noActiveFollowup: true };
    }
    const currentFollowup = currentResult.rows[0];
    if (actor.role === 'staff' && currentFollowup.assigned_to !== actor.id) {
      await client.query('ROLLBACK');
      return { forbidden: true };
    }
    if (
      actor.role === 'staff'
      && !['in_progress', 'no_response', 'postponed', 'completed'].includes(status)
    ) {
      await client.query('ROLLBACK');
      return { invalidTransition: true };
    }
    const previousStatus = currentFollowup.status;

    if (previousStatus === status) {
      await client.query('COMMIT');
      return { status, unchanged: true };
    }

    await client.query(
      `UPDATE followups
       SET status = $1,
           completed_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [
        status,
        status === 'completed' ? new Date() : null,
        currentFollowup.id,
      ],
    );

    const eventResult = await client.query(
      `INSERT INTO followup_events
         (customer_id, followup_id, pic_id, event_type, previous_status,
          new_status, performed_by)
       VALUES ($1, $2, $3, 'status', $4, $5, $6)
       RETURNING id`,
      [
        customerId,
        currentFollowup.id,
        currentFollowup.assigned_to,
        previousStatus,
        status,
        actor.id,
      ],
    );

    await client.query('COMMIT');
    return {
      status,
      previousStatus,
      eventId: eventResult.rows[0]?.id,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createActivity = async ({
  customerId,
  channel,
  note,
  result,
  actor,
}) => {
  const client = await pool.connect();
  let event;
  try {
    await client.query('BEGIN');
    const customerResult = await client.query(
      `SELECT customer.contact_permission, followup.id AS followup_id,
         followup.assigned_to
       FROM customers customer
       LEFT JOIN LATERAL (
         SELECT id, assigned_to
         FROM followups
         WHERE customer_id = customer.id
           AND status IN ('pending', 'in_progress', 'no_response', 'postponed')
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1
       ) followup ON TRUE
       WHERE customer.id = $1 AND customer.status = 'active'
       FOR UPDATE OF customer`,
      [customerId],
    );
    if (!customerResult.rowCount) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }
    if (!customerResult.rows[0].contact_permission) {
      await client.query('ROLLBACK');
      return { blocked: true };
    }
    const followup = customerResult.rows[0];
    if (actor.role === 'staff' && followup.assigned_to !== actor.id) {
      await client.query('ROLLBACK');
      return { forbidden: true };
    }
    if (!followup.followup_id) {
      await client.query('ROLLBACK');
      return { noActiveFollowup: true };
    }

    const resultRow = await client.query(
      `INSERT INTO followup_events
         (customer_id, followup_id, pic_id, event_type, channel, note, result, performed_by)
       VALUES ($1, $2, $3, 'activity', $4, $5, $6, $7)
       RETURNING id, event_type AS "eventType", channel, note, result,
         created_at AS "createdAt", performed_by AS "performedById",
         pic_id AS "picId"`,
      [
        customerId,
        followup.followup_id,
        followup.assigned_to,
        channel,
        note,
        result,
        actor.id,
      ],
    );
    event = resultRow.rows[0];
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const actorResult = await pool.query(
    'SELECT name FROM users WHERE id = $1',
    [actor.id],
  );
  const customer = await pool.query(
    'SELECT name AS "picName" FROM users WHERE id = $1',
    [event.picId],
  );

  return {
    ...event,
    performedBy: actorResult.rows[0]?.name || null,
    picName: customer.rows[0]?.picName || null,
  };
};

const FollowupRepositories = {
  findAll,
  findHistory,
  updateStatus,
  createActivity,
};

export default FollowupRepositories;
